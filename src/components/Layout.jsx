export default function Layout({ title, controls, children }) {
  return (
    <div className="appRoot">
      <header className="appHeader">
        <div className="appTitle">{title}</div>
        <div className="appControls">{controls}</div>
      </header>

      <main className="appMain" role="main">
        {children}
      </main>
    </div>
  );
}
