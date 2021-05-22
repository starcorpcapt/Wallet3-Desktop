import './PendingTx.css';

import { Application } from '../../viewmodels/Application';
import { CryptoIcons } from '../../misc/Icons';
import Feather from 'feather-icons-react';
import { GasnowWs } from '../../../api/Gasnow';
import { NavBar } from '../../components';
import { Networks } from '../../viewmodels/NetworksVM';
import React from 'react';
import { WalletVM } from '../../viewmodels/WalletVM';
import { convertTxToUrl } from '../../../misc/Url';
import shell from '../../bridges/Shell';

export default ({ app, walletVM }: { app: Application; walletVM: WalletVM }) => {
  const { pendingTxVM: vm } = walletVM;

  const chain = Networks.find((n) => n?.chainId === vm.chainId);
  return (
    <div className="page pending-tx">
      <NavBar title="Pending Transaction" onBackClick={() => app.history.goBack()} />

      <div className="form">
        <div>
          <span>Chain:</span>
          <span>
            <img src={CryptoIcons(chain.symbol)} alt="" />
            {chain.network}
          </span>
        </div>

        <div>
          <span>From:</span>
          <span title={vm?.from}>{vm?.from}</span>
        </div>

        <div>
          <span>To:</span>
          <span title={vm?.to}>{vm?.to}</span>
        </div>

        <div>
          <span>Value:</span>
          <span>{`${vm?.value} ${chain.symbol}`}</span>
        </div>

        <div>
          <span>Gas Limit:</span>
          <span>{vm?.gasLimit}</span>
        </div>

        <div>
          <span>Gas Price:</span>
          <span>{`${vm?.gasPrice / GasnowWs.gwei_1} Gwei`}</span>
        </div>

        <div>
          <span>Nonce:</span>
          <span>{vm?.nonce}</span>
        </div>

        <div className="data">
          <span>Data:</span>
          <span>{vm?.data}</span>
        </div>

        <div>
          <span></span>
          <span className="link" onClick={(_) => shell.open(convertTxToUrl(vm._tx))}>
            View on Etherscan
          </span>
        </div>
      </div>

      <div className="actions">
        <button onClick={(_) => vm.cancelTx().then(() => app.history.goBack())}>
          {/* <Feather icon="x" size={14} strokeWidth={2} /> */}
          <span>Cancel</span>
        </button>
        <button onClick={(_) => vm.speedUp().then(() => app.history.goBack())}>
          {/* <Feather icon="chevrons-up" size={14} strokeWidth={2} /> */}
          <span>Speed Up</span>
        </button>
      </div>
    </div>
  );
};