import { models } from "@b/db";

export async function getProduct(id: string): Promise<any> {
  const extension = await models.extension.findOne({
    where: { productId: id },
  });

  if (!extension) {
    throw new Error("Extension not found");
  }

  return extension;
}

export async function getBlockchain(id: string): Promise<any> {
  const blockchain = await models.ecosystemBlockchain.findOne({
    where: { productId: id },
  });

  if (!blockchain) {
    throw new Error("Blockchain not found");
  }

  return blockchain;
}
