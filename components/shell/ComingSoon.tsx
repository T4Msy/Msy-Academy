export function ComingSoon({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{description}</p>
        </div>
      </div>
      <div className="empty-state">
        <div className="empty-icon">
          <svg fill="none" width="26" height="26" viewBox="0 0 24 24">
            <path
              d="M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="empty-title">Em construção</div>
        <p className="empty-text">
          Esta aba já está no menu, mas a funcionalidade chega na {phase} do
          desenvolvimento da plataforma.
        </p>
      </div>
    </>
  );
}
