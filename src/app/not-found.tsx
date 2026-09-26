import Button from "@/components/ui/button";
import ButtonArrow from "@/components/ui/buttonArrow";
import Link from "next/link";
import { HeroIllustration } from "@/components/illustrations";

const NotFound = () => {
  return (
    <main className="pt-10 pb-20 sm:pt-16 lg:pb-28">
      <div className="container">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="text-sm font-bold tracking-[0.12em] text-secondary uppercase">
              Error 404
            </p>
            <h1 className="display-1 mt-4 text-balance">
              This page took a
              <br />
              wrong <span className="marker">turn</span>.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-secondary text-pretty">
              The page you&apos;re looking for isn&apos;t here. It may have moved,
              or the link that brought you here is out of date.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="accent" size="lg" className="max-sm:w-full">
                <Link href="/courses">
                  <span>Browse courses</span>
                  <ButtonArrow />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="max-sm:w-full">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </div>

          <div aria-hidden="true" className="lg:col-span-6">
            <HeroIllustration />
          </div>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
