import React from "react";
import EmailConfirmationPage from "../components/EmailConfirmationPage";

const EmailConfirmPage: React.FC = () => {
  return <EmailConfirmationPage onBack={() => window.history.back()} />;
};

export default EmailConfirmPage;
