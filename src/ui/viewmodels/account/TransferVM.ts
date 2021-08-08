import { BigNumber, ethers, utils } from 'ethers';
import Gasnow, { Gwei_1 } from '../../../gas/Gasnow';
import { IReactionDisposer, autorun, makeAutoObservable, reaction, runInAction } from 'mobx';
import Messages, { ConfirmSendTx } from '../../../common/Messages';
import { getMaxPriorityFee, getNextBlockBaseFee } from '../../../common/Provider';
import { parseEther, parseUnits } from 'ethers/lib/utils';

import { AccountVM } from '../AccountVM';
import App from '../Application';
import ERC1155ABI from '../../../abis/ERC1155.json';
import ERC20ABI from '../../../abis/ERC20.json';
import ERC721ABI from '../../../abis/ERC721.json';
import GasStation from '../../../gas';
import { NFT } from '../models/NFT';
import NetworksVM from '../NetworksVM';
import { UserToken } from '../models/UserToken';
import ipc from '../../bridges/IPC';
import store from 'storejs';

export class TransferVM {
  private readonly _accountVM: AccountVM;
  private gasnowDisposer: IReactionDisposer;

  loading = false;
  self = '';
  recipient: string = '';
  receiptAddress = '';
  isEns = false;
  amount: string = '';
  gas: number = 0;
  nonce: number = 0;
  gasPrice: number = -1; // Gwei
  priorityPrice: number = 0; // Gwei
  gasLevel = 1; // 0 - rapid, 1 - fast, 2 - standard, 4 - custom
  sending = false;
  nextBlockBaseFee = 0;

  get isValid() {
    try {
      const validAmount = this.amountBigInt.lte(this.selectedTokenBalance) && Number.parseFloat(this.amount) >= 0;

      return (
        this.selectedTokenBalance.gt(0) &&
        this.receiptAddress &&
        this.recipient &&
        this.amount.length > 0 &&
        validAmount &&
        this.gas >= 21000 &&
        this.gas < 12_500_000 &&
        this.nonce >= 0 &&
        !this.loading &&
        (NetworksVM.currentNetwork.eip1559 ? this.priorityPrice : true) &&
        this.gasPrice > 0 &&
        this.gasPrice <= 9007199 // MAX_SAFE_INTEGER * gwei_1
      );
    } catch (error) {
      return false;
    }
  }

  get isNFTValid() {
    return this.receiptAddress && !this.insufficientFee;
  }

  get insufficientFee() {
    const maxFee = Number.parseInt((this.gasPrice * Gwei_1 * this.gas || 0) as any);
    const balance = parseEther(this._accountVM?.nativeToken?.amount.toString() || '0');
    return balance.lt(maxFee.toString());
  }

  get isERC20() {
    return this.selectedToken?.id.startsWith('0x') ?? false;
  }

  get amountBigInt() {
    return parseUnits(this.amount || '0', this.selectedToken?.decimals ?? 18);
  }

  get selectedTokenMaxBalance() {
    return utils.formatUnits(this.selectedTokenBalance, this.selectedToken?.decimals);
  }

  selectedToken: UserToken = null;
  selectedTokenBalance = BigNumber.from(0);
  recipients: { id: number; name: string }[] = [];

  // Gwei
  rapid = 0;
  fast = 0;
  standard = 0;

  constructor(accountVM: AccountVM) {
    makeAutoObservable(this);
    this._accountVM = accountVM;
    this.self = accountVM.address;
    this.selectedToken = accountVM.allTokens[0];

    this.rapid = Gasnow.rapidGwei;
    this.standard = Gasnow.standardGwei;
    this.fast = Gasnow.fastGwei;

    this.initGasPrice();
    this.initNonce();

    this.recipients = store.get('recipients') || [];
  }

  async setRecipient(addressOrName: string) {
    this.recipient = addressOrName;
    let addr = '';

    if (ethers.utils.isAddress(addressOrName)) {
      addr = this.receiptAddress = addressOrName;
      this.isEns = false;
    } else {
      this.loading = true;

      try {
        addr = await NetworksVM.currentProvider.resolveName(addressOrName);
      } catch (e) {
        return;
      } finally {
        runInAction(() => (this.loading = false));
      }

      if (!addr) {
        this.receiptAddress = '';
        this.isEns = false;
        return;
      }

      runInAction(() => {
        this.isEns = true;
        this.receiptAddress = addr;
      });
    }

    await this.estimateGas();
    runInAction(() => (this.loading = false));
  }

  selectToken(id: string) {
    const token = this._accountVM.allTokens.find((t) => t.id === id);
    this.selectedToken = token ?? this._accountVM.allTokens[0];
    this.estimateGas();
    this.refreshBalance();
  }

  setToken(token: UserToken) {
    this.selectedToken = token;
    this.amount = '';
    this.estimateGas();
    this.refreshBalance();
  }

  setGasPrice(price: number) {
    this.gasPrice = price;
  }

  setPriorityPrice(gwei: number) {
    this.priorityPrice = Math.max(gwei, 0) || 0;
  }

  setNonce(nonce: number) {
    this.nonce = nonce;
  }

  setGas(gas: number) {
    this.gas = gas;
  }

  setGasLevel(level: number) {
    this.gasLevel = level;
    this.autoSetGasPrice();
  }

  setAmount(amount: string) {
    this.amount = amount;
  }

  private autoSetGasPrice() {
    switch (this.gasLevel) {
      case 0:
        this.setGasPrice(this.rapid);
        break;
      case 1:
        this.setGasPrice(this.fast);
        break;
      case 2:
        this.setGasPrice(this.standard);
        break;
    }
  }

  private fetchBaseFee = async (chainId: number) => {
    const nextBlockBaseFee = await getNextBlockBaseFee(chainId);
    if (!nextBlockBaseFee) return;

    await getMaxPriorityFee(chainId);

    runInAction(() => {
      this.nextBlockBaseFee = nextBlockBaseFee;
    });
  };

  private initGasPrice() {
    this.gasnowDisposer = autorun(() => {
      const rapid = GasStation.rapidGwei;
      const fast = GasStation.fastGwei;
      const standard = GasStation.standardGwei;

      runInAction(() => {
        this.rapid = rapid;
        this.fast = fast;
        this.standard = standard;
        this.autoSetGasPrice();
      });
    });

    GasStation.chainId = NetworksVM.currentChainId;
    GasStation.refresh();

    const { currentNetwork } = NetworksVM;
    if (!currentNetwork.eip1559) return;

    this.fetchBaseFee(currentNetwork.chainId);
    NetworksVM.currentProvider.on('block', async () => this.fetchBaseFee(currentNetwork.chainId));
  }

  private initNonce() {
    NetworksVM.currentProvider
      .getTransactionCount(this.self, 'pending')
      .then((nonce) => runInAction(() => (this.nonce = nonce)));
  }

  private async estimateGas() {
    runInAction(() => (this.loading = true));

    try {
      const setGas = (amount: number) => runInAction(() => this.setGas(amount));

      const estimateNormalGas = async () => {
        if (!this.receiptAddress) return 21000;

        try {
          const gas = await NetworksVM.currentProvider.estimateGas({
            to: this.receiptAddress,
            value: 1,
          });

          return gas.toNumber();
        } catch (error) {
          return 21000;
        }
      };

      if (!this.selectToken || !this.isERC20) {
        setGas(await estimateNormalGas());
        return;
      }

      const erc20 = new ethers.Contract(this.selectedToken.id, ERC20ABI, NetworksVM.currentProvider);
      const amt = this.amountBigInt;

      try {
        const v = await erc20.estimateGas.transferFrom(
          this.self,
          this.receiptAddress || '0xD1b05E3AFEDcb11F29c5A560D098170bE26Fe5f5',
          amt
        );

        setGas(Number.parseInt((v.toNumber() * 2) as any));
      } catch (error) {
        setGas(150_000);
      }
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  private refreshBalance() {
    this.selectedTokenBalance = BigNumber.from(0);

    if (this.isERC20) {
      const erc20 = new ethers.Contract(this.selectedToken.id, ERC20ABI, NetworksVM.currentProvider);
      erc20.balanceOf(this.self).then((v: BigNumber) =>
        runInAction(() => {
          this.selectedTokenBalance = v;
          this.selectedToken.amount = Number.parseFloat(utils.formatUnits(v, this.selectedToken.decimals));
        })
      );
      return;
    }

    NetworksVM.currentProvider.getBalance(this.self).then((v) => runInAction(() => (this.selectedTokenBalance = v)));
  }

  dispose() {
    NetworksVM.currentProvider.off('block');
    this.gasnowDisposer?.();
    this.gasnowDisposer = undefined;
  }

  async sendTx() {
    if (this.sending) return;
    this.sending = true;

    let value = this.isERC20 ? 0 : this.amountBigInt.toString();
    const to = this.isERC20 ? this.selectedToken.id : this.receiptAddress;

    const iface = new ethers.utils.Interface(ERC20ABI);
    const data = this.isERC20 ? iface.encodeFunctionData('transfer', [this.receiptAddress, this.amountBigInt]) : '0x';

    const fee = BigNumber.from(this.gasPrice * Gwei_1).mul(this.gas);
    if (!this.isERC20 && fee.add(BigNumber.from(value)).gt(this.selectedTokenBalance)) {
      value = BigNumber.from(this.selectedToken.wei || 0)
        .sub(fee)
        .toString();
    }

    const eip1559 = NetworksVM.currentNetwork.eip1559;

    await ipc.invokeSecure<void>(Messages.createTransferTx, {
      from: this._accountVM.address,
      to,
      value,
      gas: this.gas,
      gasPrice: eip1559 ? undefined : this.gasPrice * Gwei_1,
      maxFeePerGas: eip1559 ? this.gasPrice * Gwei_1 : undefined,
      maxPriorityFeePerGas: eip1559 ? this.priorityPrice * Gwei_1 : undefined,
      nonce: this.nonce,
      data,
      chainId: NetworksVM.currentChainId,

      recipient: {
        address: this.receiptAddress,
        name: this.isEns
          ? this.recipient
          : App.currentWallet.accounts.find((ac) => ac.address === utils.getAddress(this.receiptAddress))?.name ?? '',
      },

      transferToken: this.isERC20
        ? {
            symbol: this.selectedToken.symbol,
            decimals: this.selectedToken.decimals,
          }
        : undefined,
    } as ConfirmSendTx);

    this.saveRecipients(this.recipient);

    runInAction(() => (this.sending = false));
  }

  async sendNFT(nft: NFT) {
    if (this.sending) return;
    this.sending = true;

    let gas = 0;
    let data = '';

    switch (nft.contractType) {
      case 'standard':
        {
          const erc721 = new ethers.Contract(nft.contract, ERC721ABI, NetworksVM.currentProvider);
          const iface = new ethers.utils.Interface(ERC721ABI);
          gas = (await erc721.estimateGas.transferFrom(this.self, this.receiptAddress, nft.tokenId)).toNumber();
          data = iface.encodeFunctionData('transferFrom', [this.self, this.receiptAddress, nft.tokenId]);
        }
        break;
      case 'Rarible':
        try {
          const erc1155 = new ethers.Contract(nft.contract, ERC1155ABI, NetworksVM.currentProvider);
          const iface = new ethers.utils.Interface(ERC1155ABI);
          const empty = ethers.utils.arrayify('0x');
          data = iface.encodeFunctionData('safeTransferFrom', [this.self, this.receiptAddress, nft.tokenId, 1, empty]);
          gas = (await erc1155.estimateGas.safeTransferFrom(this.self, this.receiptAddress, nft.tokenId, 1, empty)).toNumber();
        } catch (error) {
          gas = 100_000;
        }
        break;
    }

    await ipc.invokeSecure<void>(Messages.createTransferTx, {
      from: this._accountVM.address,
      to: nft.contract,
      value: '0',
      gas: gas,
      gasPrice: this.gasPrice * Gwei_1,
      nonce: this.nonce,
      data,
      chainId: NetworksVM.currentChainId,

      recipient: {
        address: this.receiptAddress,
        name: this.isEns
          ? this.recipient
          : App.currentWallet.accounts.find((ac) => ac.address === utils.getAddress(this.receiptAddress))?.name ?? '',
      },

      transferToken: undefined,
    } as ConfirmSendTx);

    this.saveRecipients(this.recipient);

    this.sending = false;
  }

  private saveRecipients(recipient: string) {
    if (this.recipients.find((a) => a.name.toLowerCase() === recipient.toLowerCase())) return;

    this.recipients.push({ id: Date.now(), name: recipient });
    store.set('recipients', this.recipients);
  }
}
