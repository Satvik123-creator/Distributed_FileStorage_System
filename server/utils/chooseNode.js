const nodes = ["node1", "node2", "node3"];
let currentIndex = 0;

const chooseNode = () => {
  const node = nodes[currentIndex];
  currentIndex = (currentIndex + 1) % nodes.length;
  return node;
};

export default chooseNode;
