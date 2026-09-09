import { useDashboardStore } from "@/stores/dashboard";
import React, { useEffect, FC, useMemo } from "react";
import { ExchangeXImage } from "../elements/ExchangeXImage";

interface LogoTextProps {
  className?: string;
}

const LogoText: FC<LogoTextProps> = ({ className: classes }) => {
  const { isDark, settings } = useDashboardStore();

  const fullLogoSrc = useMemo(() => {
    if (settings?.fullLogo || settings?.fullLogoDark) {
      return isDark
        ? settings?.fullLogoDark || settings?.fullLogo
        : settings?.fullLogo;
    }
    // Brand default when no full logo has been configured in admin settings.
    return isDark ? "/wordmark_xchange_blw.png" : "/wordmark_xchange_blb.png";
  }, [isDark, settings]);

  return (
    <div className={`flex items-center h-[30px] w-[100px] ${classes}`}>
      <ExchangeXImage
        className="max-h-full w-full fill-current"
        src={fullLogoSrc}
        alt="ExchangeX"
        width={100}
        height={30}
      />
    </div>
  );
};

export default LogoText;
