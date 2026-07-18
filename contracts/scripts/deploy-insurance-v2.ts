import { ethers } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

// Base Sepolia defaults
const USDC_BASE_SEPOLIA    = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const RESERVE_BASE_SEPOLIA = "0xF5010Afe1856be1F447f962Dfa8AA30c2Ed19a47";

async function main() {
  console.log("🚀 Starting deployment of ZeusInsuranceV2...");

  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("No signer — check PRIVATE_KEY");

  console.log(`📡 Deploying with account: ${deployer.address}`);
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
  if (balance === 0n) throw new Error("Deployer has 0 ETH");

  const usdcAddress    = process.env.USDC_ADDRESS    ?? USDC_BASE_SEPOLIA;
  const reserveAddress = process.env.RESERVE_ADDRESS ?? RESERVE_BASE_SEPOLIA;

  if (!ethers.isAddress(usdcAddress))    throw new Error(`Invalid USDC_ADDRESS: ${usdcAddress}`);
  if (!ethers.isAddress(reserveAddress)) throw new Error(`Invalid RESERVE_ADDRESS: ${reserveAddress}`);

  console.log(`\n  USDC:    ${usdcAddress}`);
  console.log(`  Reserve: ${reserveAddress}`);

  // 1. Deploy ZeusInsuranceV2
  console.log("\n📦 Deploying ZeusInsuranceV2...");
  const ZeusInsuranceV2 = await ethers.getContractFactory("ZeusInsuranceV2");
  const insurance = await ZeusInsuranceV2.deploy(usdcAddress, reserveAddress);
  await insurance.waitForDeployment();

  const insuranceAddress = await insurance.getAddress();
  console.log(`✅ ZeusInsuranceV2 deployed to: ${insuranceAddress}`);

  // 2. Verify on BaseScan
  console.log("\n🔍 Verifying contract on BaseScan...");
  try {
    const hre = await import("hardhat");
    await hre.run("verify:verify", {
      address: insuranceAddress,
      constructorArguments: [usdcAddress, reserveAddress],
    });
    console.log("✅ Contract verified on BaseScan");
  } catch (error) {
    console.log("⚠️  Verification failed (may already be verified):", error);
  }

  // 3. Update SDK with new insurance address (base-sepolia network entry)
  console.log("\n📝 Updating SDK with new contract address...");
  const sdkTypesPath = path.join(__dirname, "../../sdk/src/types/index.ts");

  if (fs.existsSync(sdkTypesPath)) {
    let sdkContent = fs.readFileSync(sdkTypesPath, "utf8");
    sdkContent = sdkContent.replace(
      /insuranceAddress:\s*"0x[a-fA-F0-9]{40}"|insuranceAddress:\s*""/,
      `insuranceAddress: "${insuranceAddress}"`
    );
    fs.writeFileSync(sdkTypesPath, sdkContent);
    console.log(`✅ SDK updated with new address: ${insuranceAddress}`);
  } else {
    console.log(`⚠️  SDK types file not found at ${sdkTypesPath} — skipping SDK update`);
  }

  console.log("\n🎉 Deployment complete!");
  console.log(`📝 Add to .env:\nZEUS_INSURANCE_ADDRESS=${insuranceAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
