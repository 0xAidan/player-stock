const hre = require("hardhat");

async function main() {
  console.log("Deploying PlayerToken contract...");

  const PlayerToken = await hre.ethers.getContractFactory("PlayerToken");
  const playerToken = await PlayerToken.deploy();

  await playerToken.waitForDeployment();

  console.log("PlayerToken deployed to:", await playerToken.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 