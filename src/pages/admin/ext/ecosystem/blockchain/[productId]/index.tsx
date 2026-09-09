import React, { useState } from "react";
import Layout from "@/layouts/Default";
import { useTranslation } from "next-i18next";
import { $serverFetch } from "@/utils/api";
import $fetch from "@/utils/api";
import Card from "@/components/elements/base/card/Card";
import Button from "@/components/elements/base/button/Button";
import { Icon } from "@iconify/react";
import { BackButton } from "@/components/elements/base/button/BackButton";

interface Props {
  initialProductId: string;
  initialBlockchainVersion: string;
  initialBlockchainChain: string | null;
  initialBlockchainDescription: string | null;
  initialBlockchainStatus: boolean;
}

const BlockchainDetails: React.FC<Props> = ({
  initialProductId,
  initialBlockchainVersion,
  initialBlockchainChain,
  initialBlockchainDescription,
  initialBlockchainStatus,
}) => {
  const { t } = useTranslation();

  const [productId] = useState(initialProductId);
  const [blockchainChain] = useState(initialBlockchainChain);
  const [blockchainDescription] = useState(initialBlockchainDescription);
  const [blockchainVersion] = useState(initialBlockchainVersion);
  const [blockchainStatus, setBlockchainStatus] = useState(
    initialBlockchainStatus
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleActivateBlockchain = async () => {
    setIsSubmitting(true);
    const { error } = await $fetch({
      url: `/api/admin/ext/ecosystem/blockchain/${productId}/status`,
      method: "PUT",
      body: { status: !blockchainStatus },
    });
    if (!error) {
      setBlockchainStatus(!blockchainStatus);
    }
    setIsSubmitting(false);
  };

  return (
    <Layout title={t("Blockchain Details")} color="muted">
      {/* Top Bar */}
      <div className="flex justify-between items-center w-full mb-8 text-muted-800 dark:text-muted-200">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold">
            {blockchainChain || t("Blockchain Details")}
          </h1>
          <p className="text-sm text-muted-600 dark:text-muted-400">
            {t("Current Version")}:{" "}
            <span className="font-medium text-info-500">
              {blockchainVersion}
            </span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div
            className={`w-4 h-4 rounded-full ${
              blockchainStatus ? "bg-green-500" : "bg-red-500"
            }`}
            title={blockchainStatus ? t("Enabled") : t("Disabled")}
          />
          <span className="text-sm">
            {blockchainStatus ? t("Enabled") : t("Disabled")}
          </span>

          {blockchainVersion !== "0.0.1" && (
            <Button
              color={blockchainStatus ? "danger" : "success"}
              onClick={handleActivateBlockchain}
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              <Icon
                icon={blockchainStatus ? "carbon:close" : "carbon:checkmark"}
                className="mr-2 h-5 w-5"
              />
              {blockchainStatus ? t("Disable") : t("Enable")}
            </Button>
          )}
          <BackButton href={"/admin/ext/ecosystem"} />
        </div>
      </div>

      <Card className="p-5 space-y-5 shadow-xs border border-muted-200 dark:border-muted-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {t("About This Blockchain")}
        </h3>
        <p className="text-sm text-muted-600 dark:text-muted-400">
          {blockchainDescription ||
            t("No description is available for this blockchain.")}
        </p>
      </Card>
    </Layout>
  );
};

export const permission = "Access Blockchain Management";

export async function getServerSideProps(context: any) {
  const emptyProps = {
    initialProductId: "",
    initialBlockchainVersion: "",
    initialBlockchainChain: null,
    initialBlockchainDescription: null,
    initialBlockchainStatus: false,
  };

  try {
    const { productId } = context.query;

    if (!productId) {
      return { props: emptyProps };
    }

    const blockchainResponse = await $serverFetch(context, {
      url: `/api/admin/ext/ecosystem/blockchain/${productId}`,
    });

    const blockchainData = blockchainResponse.data || {};

    return {
      props: {
        initialProductId: productId,
        initialBlockchainVersion: blockchainData.version || "",
        initialBlockchainChain: blockchainData.chain || null,
        initialBlockchainDescription: blockchainData.description || null,
        initialBlockchainStatus: blockchainData.status || false,
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { props: emptyProps };
  }
}

export default BlockchainDetails;
