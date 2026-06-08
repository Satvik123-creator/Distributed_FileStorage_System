import { selectLeastLoadedNode } from "../services/loadBalancerService.js";

const chooseNode = async () => {
  return await selectLeastLoadedNode();
};

export default chooseNode;
