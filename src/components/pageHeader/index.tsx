import React, { ReactNode } from "react";
import SectionTitle from "../sectionTitle";

type PropsType = {
  children: ReactNode;
  subTitle: string;
  description: string;
};

/*
 * Inner-page masthead. Left-aligned and rule-bounded on the page ground — the
 * old version centred a background photograph behind the copy.
 */
const PageHeader = ({ children, subTitle, description }: PropsType) => {
  return (
    <section className="border-b-[1.5px] border-ink bg-background pt-14 pb-12 sm:pt-20 sm:pb-16">
      <div className="container">
        <SectionTitle subTitle={subTitle} description={description}>
          {children}
        </SectionTitle>
      </div>
    </section>
  );
};

export default PageHeader;
