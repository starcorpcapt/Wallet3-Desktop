import './MainLayout.css';

import { DApps123, Settings, Wallet } from '../app';
import { Link, useLocation, useRouteMatch } from 'react-router-dom';
import { Route, Switch } from 'react-router';

import { Application } from '../../viewmodels/Application';
import { CurrencyVM } from '../../viewmodels/settings/CurrencyVM';
import Feather from 'feather-icons-react';
import { LangsVM } from '../../viewmodels/settings/LangsVM';
import { NetworksVM } from '../../viewmodels/NetworksVM';
import React from 'react';
import { SkeletonTheme } from 'react-loading-skeleton';
import { WalletVM } from '../../viewmodels/WalletVM';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

interface Props {
  networksVM: NetworksVM;
  walletVM: WalletVM;
  app: Application;
  currencyVM: CurrencyVM;
  langsVM: LangsVM;
}

export default observer((args: Props) => {
  const { path, url } = useRouteMatch();
  const { pathname } = useLocation();
  const { t } = useTranslation();

  let activeTab = '';
  if (pathname.endsWith('settings')) activeTab = 'settings';
  if (pathname.endsWith('dapps')) activeTab = 'dapps';

  return (
    <SkeletonTheme color="#eeeeee90" highlightColor="#f5f5f5d0">
      <div className="layout">
        <div className="ui">
          <Switch>
            <Route path={`${path}/settings`} exact>
              <Settings {...args} />
            </Route>

            <Route path={`${path}/dapps`} exact>
              <DApps123 {...args} />
            </Route>

            <Route path={path}>
              <Wallet {...args} />
            </Route>
          </Switch>
        </div>

        <div className="tabs">
          <Link to={`${url}`}>
            <div className={activeTab === '' ? 'active' : ''}>
              <Feather icon="credit-card" size={20} />
              <span>{t('Wallet')}</span>
            </div>
          </Link>

          <Link to={`${url}/dapps`}>
            <div className={activeTab === 'dapps' ? 'active' : ''}>
              <Feather icon="compass" size={20} />
              <span>DApps</span>
            </div>
          </Link>

          <Link to={`${url}/settings`}>
            <div className={activeTab === 'settings' ? 'active' : ''}>
              <Feather icon="settings" size={20} />
              <span>{t('Settings')}</span>
            </div>
          </Link>
        </div>
      </div>
    </SkeletonTheme>
  );
});
