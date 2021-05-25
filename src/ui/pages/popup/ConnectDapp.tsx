import './ConnectDapp.css';
import '@szhsin/react-menu/dist/index.css';

import { Image, PopupTitle } from '../../components';
import { Menu, MenuButton, MenuDivider, MenuItem } from '@szhsin/react-menu';

import { ApplicationPopup } from '../../viewmodels/ApplicationPopup';
import NetworkLabel from '../app/components/NetworkLabel';
import React from 'react';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';

export default observer(({ app }: { app: ApplicationPopup }) => {
  const { connectDappVM: vm } = app;
  const { t } = useTranslation();

  return (
    <div className="page connectdapp">
      <PopupTitle title={t('ConnectDapp')} icon="anchor" />

      <div className="content">
        <div className="networks">
          <Menu
            menuButton={() => (
              <MenuButton className="menu-button">
                <NetworkLabel chainId={vm?.chainId ?? 0} />
              </MenuButton>
            )}
            styles={{ minWidth: '3.5rem' }}
            direction="bottom"
            overflow="auto"
            position="anchor"
          >
            <MenuItem styles={{ padding: '8px 12px' }}>
              <NetworkLabel chainId={0} expand />
            </MenuItem>
            <MenuDivider />
          </Menu>
        </div>

        <div className="appinfo">
          <Image src={vm.icon} alt={vm.appName} />
          <div>{vm.appName}</div>
          <div className="desc" title={vm.desc}>
            {vm.desc}
          </div>
          <div>{vm.url}</div>
        </div>
      </div>

      <div className="actions">
        <button
          onClick={(_) => {
            vm.reject();
            window.close();
          }}
        >
          {t('Reject')}
        </button>
        <button
          className="positive"
          onClick={(_) => {
            vm.approve();
            window.close();
          }}
        >
          {t('Approve')}
        </button>
      </div>
    </div>
  );
});
