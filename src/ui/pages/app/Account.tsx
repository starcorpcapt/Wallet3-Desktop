import './Account.css';

import React, { useEffect, useState } from 'react';

import { Application } from '../../viewmodels/Application';
import CheckIcon from '../../../assets/icons/app/check.svg';
import Clipboard from '../../bridges/Clipboard';
import CopyIcon from '../../../assets/icons/app/copy.svg';
import { NavBar } from '../../components';
import QRCode from 'qrcode.react';
import Shell from '../../bridges/Shell';
import { WalletVM } from '../../viewmodels/WalletVM';

export default ({ app, walletVM }: { app: Application; walletVM: WalletVM }) => {
  const [showCheck, setShowCheck] = useState(false);

  const address = walletVM.currentAccount.address;

  return (
    <div className="page account">
      <NavBar title="Account" onBackClick={() => app.history.goBack()} />

      <div className="content">
        <div>
          <QRCode value={address} size={150} bgColor="transparent" />
          <div className="addr">
            <span onClick={(_) => Shell.open(`https://etherscan.io/address/${address}`)}>{address}</span>

            {showCheck ? (
              <img src={CheckIcon} alt="Copied" />
            ) : (
              <span
                onClick={(_) => {
                  Clipboard.writeText(address);
                  setShowCheck(true);
                  setTimeout(() => setShowCheck(false), 3000);
                }}
              >
                <img src={CopyIcon} alt="copy" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
