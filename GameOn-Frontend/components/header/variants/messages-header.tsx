import React from "react";
import { Logo } from "@/components/header/logo";
import PageTitle from "@/components/header/page-title";
import Header from "@/components/header/header";

export default function MessagesHeader() {
  return <Header left={<Logo />} center={<PageTitle title="Messages" />} />;
}
