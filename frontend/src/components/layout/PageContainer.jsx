function PageContainer({ children, className = "" }) {
  return (
    <main
      className={`
        min-w-0 flex-1
        overflow-x-hidden
        bg-taste-background
        ${className}
      `}
    >
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </div>
    </main>
  );
}

export default PageContainer;