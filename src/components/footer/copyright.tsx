const Copyright = () => {
  return (
    <div className="border-t-[1.5px] border-white/15 py-6">
      <div className="container">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} EdventureHub. All rights reserved.
          </p>
          <p className="text-xs text-white/60">
            Built for people who learn by doing.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Copyright;
