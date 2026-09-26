import PageHeader from "../pageHeader";
import ContactForm from "./form";

const Contact = () => {
  return (
    <main>
      <PageHeader
        subTitle="Contact Us"
        description="Questions about a course, your account, or working with us? Send a message and we'll get back to you."
      >
        Get in <span className="marker">touch</span>
      </PageHeader>
      <ContactForm />
    </main>
  );
};

export default Contact;
