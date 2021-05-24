import './Auth.css';

import * as Anime from '../../misc/Anime';

import { ApplicationPopup } from '../../viewmodels/ApplicationPopup';
import AuthView from './confirms/AuthView';
import Messages from '../../../common/Messages';
import { PopupTitle } from '../../components';
import React from 'react';
import crypto from '../../bridges/Crypto';
import ipc from '../../bridges/IPC';

export default ({ app }: { app: ApplicationPopup }) => {
  const params = new URLSearchParams(window.location.search);
  const authId = params.get('id');

  const authViaTouchID = async () => {
    const success = await app.promptTouchID();

    if (success) {
      ipc.invokeSecure(`${Messages.returnAuthenticationResult(authId)}`, { success });
      window.close();
    } else {
      Anime.vibrate('div.auth > .panel');
    }
  };

  const authViaPassword = async (passcode: string) => {
    const success = await app.verifyPassword(passcode);

    if (success) {
      ipc.invokeSecure(`${Messages.returnAuthenticationResult(authId)}`, { success, password: crypto.sha256(passcode) });
      window.close();
    } else {
      Anime.vibrate('div.auth > .panel');
    }
  };

  const onCacnel = () => {
    ipc.invokeSecure(`${Messages.returnAuthenticationResult(authId)}`, { result: false });
    window.close();
  };

  return (
    <div className="page auth">
      <PopupTitle title={'Authentication'} icon={'lock'} />
      <AuthView
        touchIDSupported={app.touchIDSupported}
        onAuthTouchID={authViaTouchID}
        onAuthPasscode={authViaPassword}
        onCancel={onCacnel}
        runTouchID
      />
    </div>
  );
};