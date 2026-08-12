function LoadingLabel() {
  return <span className="visually-hidden">Memuat data</span>;
}

function SkeletonLine({ short = false }: { short?: boolean }) {
  return <span className={`skeleton skeleton--line${short ? " skeleton--short" : ""}`} />;
}

export function HomeSkeleton() {
  return (
    <div className="home-skeleton" aria-busy="true">
      <LoadingLabel />
      <header className="home-skeleton__masthead" aria-hidden="true">
        <SkeletonLine short />
        <span className="skeleton skeleton--heading" />
        <SkeletonLine short />
      </header>
      <div className="home-skeleton__grid" aria-hidden="true">
        <section>
          <SkeletonLine short />
          <span className="skeleton skeleton--feature" />
        </section>
        <aside>
          <SkeletonLine short />
          <span className="skeleton skeleton--house" />
          <SkeletonLine />
          <SkeletonLine short />
        </aside>
      </div>
    </div>
  );
}

export function AnnouncementListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="announcement-skeleton" aria-busy="true">
      <LoadingLabel />
      {Array.from({ length: rows }, (_, index) => (
        <div className="announcement-skeleton__row" aria-hidden="true" key={index}>
          <span className="skeleton skeleton--date" />
          <div>
            <SkeletonLine short />
            <span className="skeleton skeleton--heading" />
            <SkeletonLine />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AnnouncementDetailSkeleton() {
  return (
    <article className="announcement-detail-skeleton" aria-busy="true">
      <LoadingLabel />
      <SkeletonLine short />
      <span className="skeleton skeleton--display" aria-hidden="true" />
      <SkeletonLine />
      <div className="announcement-detail-skeleton__body" aria-hidden="true">
        <SkeletonLine />
        <SkeletonLine />
        <SkeletonLine />
        <SkeletonLine short />
      </div>
    </article>
  );
}

export function AgendaListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="agenda-skeleton" aria-busy="true">
      <LoadingLabel />
      <span className="skeleton skeleton--tabs" aria-hidden="true" />
      {Array.from({ length: rows }, (_, index) => (
        <div className="agenda-skeleton__row" aria-hidden="true" key={index}>
          <span className="skeleton skeleton--date" />
          <div>
            <SkeletonLine short />
            <span className="skeleton skeleton--heading" />
            <SkeletonLine />
            <SkeletonLine short />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AgendaDetailSkeleton() {
  return (
    <article className="agenda-detail-skeleton" aria-busy="true">
      <LoadingLabel />
      <SkeletonLine short />
      <span className="skeleton skeleton--display" aria-hidden="true" />
      <div className="agenda-detail-skeleton__facts" aria-hidden="true">
        {Array.from({ length: 4 }, (_, index) => (
          <span className="skeleton skeleton--control" key={index} />
        ))}
      </div>
      <div aria-hidden="true">
        <SkeletonLine />
        <SkeletonLine />
        <SkeletonLine short />
      </div>
    </article>
  );
}

export function NotificationListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="notification-skeleton" aria-busy="true">
      <LoadingLabel />
      <span className="skeleton skeleton--control" aria-hidden="true" />
      {Array.from({ length: rows }, (_, index) => (
        <div className="notification-skeleton__row" aria-hidden="true" key={index}>
          <SkeletonLine short />
          <span className="skeleton skeleton--heading" />
          <SkeletonLine />
          <SkeletonLine short />
        </div>
      ))}
    </div>
  );
}

export function AdminQueueSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="admin-queue-skeleton" aria-busy="true">
      <LoadingLabel />
      <SkeletonLine short />
      {Array.from({ length: rows }, (_, index) => (
        <div className="admin-queue-skeleton__row" aria-hidden="true" key={index}>
          <span className="skeleton skeleton--heading" />
          <SkeletonLine short />
          <div>
            <SkeletonLine />
            <SkeletonLine />
            <SkeletonLine short />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AccountSkeleton() {
  return (
    <div className="account-skeleton" aria-busy="true">
      <LoadingLabel />
      <section aria-hidden="true">
        <span className="skeleton skeleton--mark" />
        <span className="skeleton skeleton--display" />
        <SkeletonLine short />
        <div className="account-skeleton__details">
          <SkeletonLine />
          <SkeletonLine />
          <SkeletonLine />
        </div>
      </section>
      <SkeletonLine short />
    </div>
  );
}

export function OnboardingSkeleton() {
  return (
    <div className="onboarding-skeleton" aria-busy="true">
      <LoadingLabel />
      <div aria-hidden="true">
        <SkeletonLine short />
        <span className="skeleton skeleton--heading" />
        <SkeletonLine />
      </div>
      <div className="onboarding-skeleton__fields" aria-hidden="true">
        <span className="skeleton skeleton--control" />
        <span className="skeleton skeleton--control" />
        <span className="skeleton skeleton--control" />
      </div>
    </div>
  );
}
