import React from "react";
import { TokenBalanceWidget } from "./TokenBalanceWidget";

export default {
  title: "ui/data-display/TokenBalanceWidget",
  component: TokenBalanceWidget,
};

export const Normal = () => <TokenBalanceWidget amount={1234567} />;

export const Loading = () => <TokenBalanceWidget amount={0} loading />;

export const Critical = () => <TokenBalanceWidget amount={50000} criticalThreshold={100000} />;

export const Clickable = () => (
  <TokenBalanceWidget amount={1234567} onClick={() => alert("Clicked!")} />
);
