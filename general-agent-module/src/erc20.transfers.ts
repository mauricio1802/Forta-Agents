import { Finding, HandleTransaction, TransactionEvent, Log } from "forta-agent";
import { FindingGenerator } from "./utils";
import Web3 from "web3";

const web3 = new Web3();

const EVENT_SIGNATURE = "Transfer(address,address,uint256)";

type agentOptions = {
  from?: string;
  to?: string;
  amountThreshold?: string;
};

type transferInfo = {
  from: string;
  to: string;
  amount: string;
};

const fromLogToTransferInfo = (log: Log): transferInfo => {
  return {
    to: web3.eth.abi.decodeParameter("address", log.topics[2]) as any,
    from: web3.eth.abi.decodeParameter("address", log.topics[1]) as any,
    amount: web3.eth.abi.decodeParameter("uint256", log.data) as any,
  };
};

const createFilter = (options: agentOptions | undefined): ((transferInfo: transferInfo) => boolean) => {
  if (options === undefined) {
    return (_) => true;
  }

  return (transferInfo) => {
    if (options.from !== undefined && options.from !== transferInfo.from) {
      return false;
    }

    if (options.to !== undefined && options.to !== transferInfo.to) {
      return false;
    }

    if (options.amountThreshold !== undefined && options.amountThreshold > transferInfo.amount) {
      return false;
    }

    return true;
  };
};

export default function provideERC20TransferAgent(
  findingGenerator: FindingGenerator,
  tokenAddress: string,
  agentOptions?: agentOptions
): HandleTransaction {
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    const findings: Finding[] = [];

    if (txEvent.filterEvent(EVENT_SIGNATURE, tokenAddress).length > 0) {
      findings.push(findingGenerator(txEvent));
    }

    return findings;
  };
}
