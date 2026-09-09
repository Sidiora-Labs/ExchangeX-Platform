import { useDashboardStore } from "@/stores/dashboard";
import React, { useMemo, type FC } from "react";
import { ExchangeXImage } from "../elements/ExchangeXImage";

interface LogoProps {
  className?: string;
}

const Logo: FC<LogoProps> = ({ className: classes }) => {
  const { isDark, settings } = useDashboardStore();

  const logoSrc = useMemo(() => {
    if (settings?.logo || settings?.logoDark) {
      return isDark ? settings?.logoDark || settings?.logo : settings?.logo;
    }
    // Brand default when no logo has been configured in admin settings.
    return isDark ? "/logomark_xchange_bw.png" : "/logomark_xchange_b.png";
  }, [isDark, settings]);

  return (
    <div className={`flex items-center h-[30px] w-[30px] ${classes}`}>
      <ExchangeXImage src={logoSrc} alt="ExchangeX" width={30} height={30} />
    </div>
  );
};

export default Logo;
