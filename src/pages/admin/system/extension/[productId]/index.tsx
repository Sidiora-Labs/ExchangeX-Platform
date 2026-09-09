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
  initialProductVersion: string;
  initialProductTitle: string | null;
  initialProductDescription: string | null;
  initialProductStatus: boolean;
}

const ExtensionDetails: React.FC<Props> = ({
  initialProductId,
  initialProductVersion,
  initialProductTitle,
  initialProductDescription,
  initialProductStatus,
}) => {
  const { t } = useTranslation();

  const [productId] = useState(initialProductId);
  const [productTitle] = useState(initialProductTitle);
  const [productDescription] = useState(initialProductDescription);
  const [productVersion] = useState(initialProductVersion);
  const [productStatus, setProductStatus] = useState(initialProductStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleActivateExtension = async () => {
    setIsSubmitting(true);
    const { error } = await $fetch({
      url: `/api/admin/system/extension/${productId}/status`,
      method: "PUT",
      body: { status: !productStatus },
    });
    if (!error) {
      setProductStatus(!productStatus);
    }
    setIsSubmitting(false);
  };

  return (
    <Layout title={t("Extension Details")} color="muted">
      {/* Top Bar */}
      <div className="flex justify-between items-center w-full mb-8 text-muted-800 dark:text-muted-200">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl font-bold">
            {productTitle || t("Extension Details")}
          </h1>
          <p className="text-sm text-muted-600 dark:text-muted-400">
            {t("Current Version")}:{" "}
            <span className="font-medium text-info-500">{productVersion}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div
            className={`w-4 h-4 rounded-full ${
              productStatus ? "bg-green-500" : "bg-red-500"
            }`}
            title={productStatus ? t("Enabled") : t("Disabled")}
          />
          <span className="text-sm">
            {productStatus ? t("Enabled") : t("Disabled")}
          </span>
          {parseFloat(productVersion) >= 4 && (
            <Button
              color={productStatus ? "danger" : "success"}
              onClick={handleActivateExtension}
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              <Icon
                icon={productStatus ? "carbon:close" : "carbon:checkmark"}
                className="mr-2 h-5 w-5"
              />
              {productStatus ? t("Disable") : t("Enable")}
            </Button>
          )}
          <BackButton href={"/admin/system/extension"} />
        </div>
      </div>

      <Card className="p-5 space-y-5 shadow-xs border border-muted-200 dark:border-muted-700">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          {t("About This Extension")}
        </h3>
        <p className="text-sm text-muted-600 dark:text-muted-400">
          {productDescription ||
            t("No description is available for this extension.")}
        </p>
      </Card>
    </Layout>
  );
};

export const permission = "Access Extension Management";

export async function getServerSideProps(context: any) {
  const emptyProps = {
    initialProductId: "",
    initialProductVersion: "",
    initialProductTitle: null,
    initialProductDescription: null,
    initialProductStatus: false,
  };

  try {
    const { productId } = context.query;

    if (!productId) {
      return { props: emptyProps };
    }

    const productResponse = await $serverFetch(context, {
      url: `/api/admin/system/product/${productId}`,
    });

    const productData = productResponse.data || {};

    return {
      props: {
        initialProductId: productId,
        initialProductVersion: productData.version || "",
        initialProductTitle: productData.title || null,
        initialProductDescription: productData.description || null,
        initialProductStatus: productData.status || false,
      },
    };
  } catch (error) {
    console.error("Error fetching data:", error);
    return { props: emptyProps };
  }
}

export default ExtensionDetails;
