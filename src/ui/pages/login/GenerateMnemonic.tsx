import './GenerateMnemonic.css';

import React, { useEffect, useState } from 'react';

import { Application } from '../../viewmodels/Application';
import FeatherIcon from 'feather-icons-react';
import { Link } from 'react-router-dom';
import Mnemonic from '../../components/Mnemonic';
import { MnemonicVM } from '../../viewmodels/MnemonicVM';
import { NavBar } from '../../components';
import { action } from 'mobx';
import { observer } from 'mobx-react-lite';

export default observer(({ app, mnVm }: { app: Application; mnVm: MnemonicVM }) => {
  useEffect(() => {
    mnVm.requestMnemonic(12);
  }, [mnVm]);

  const [mnLength, setMnLength] = useState(12);

  return (
    <div className="page generate">
      <div>
        <NavBar title="Mnemonic" onBackClick={() => app.history.goBack()} />

        <h5>Security Tips</h5>
        <ul>
          <li>The mnemonic consists of English words, please keep them safe.</li>
          <li>Once the mnemonic gets lost, it cannot be retrieved, and you may lose all your funds.</li>
        </ul>
      </div>

      <div className="seeds no-drag">
        <Mnemonic phrases={mnVm.phrases} />

        <div className="actions">
          <div className="addr">
            <span>Address: </span>
            <span className="addr-value" title={mnVm.address}>
              {mnVm.address}
            </span>
          </div>

          <div className="switch">
            <span
              className={`button ${mnLength === 12 ? 'active' : ''}`}
              onClick={(_) => {
                setMnLength(12);
                mnVm.requestMnemonic(12);
              }}
            >
              12
            </span>
            <span> | </span>
            <span
              className={`button ${mnLength === 24 ? 'active' : ''}`}
              onClick={(_) => {
                setMnLength(24);
                mnVm.requestMnemonic(24);
              }}
            >
              24
            </span>
          </div>

          <div className="icon">
            <span className="button" onClick={(_) => mnVm.requestMnemonic(mnLength)}>
              <FeatherIcon icon="refresh-cw" size="12" />
            </span>
          </div>
        </div>
      </div>

      <div className="padding"></div>

      <Link className="button" to="/setupPassword">
        NEXT
      </Link>
    </div>
  );
});