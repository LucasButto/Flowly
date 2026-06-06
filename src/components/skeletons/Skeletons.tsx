import Skeleton from "@/components/ui/Skeleton/Skeleton";
import "./Skeletons.scss";

function HeaderSk({ button = true }: { button?: boolean }) {
  return (
    <div className="sk-header">
      <div className="sk-header__text">
        <Skeleton width="42%" height={30} radius={9} />
        <Skeleton width="58%" height={14} radius={6} />
      </div>
      {button && <Skeleton width={140} height={42} radius={12} />}
    </div>
  );
}

function repeat(n: number) {
  return Array.from({ length: n });
}

export function DashboardSkeleton() {
  return (
    <div className="sk-page">
      <div className="sk-header">
        <div className="sk-header__text">
          <Skeleton width="45%" height={34} radius={9} />
          <Skeleton width={170} height={44} radius={12} />
          <Skeleton width="30%" height={14} radius={6} />
        </div>
      </div>

      <Skeleton width={150} height={20} radius={7} />
      <div className="sk-stats">
        {repeat(4).map((_, i) => (
          <Skeleton key={i} height={80} radius={16} />
        ))}
      </div>

      <div className="sk-cols">
        {repeat(2).map((_, c) => (
          <div key={c} className="sk-stack">
            <Skeleton width="40%" height={20} radius={7} />
            {repeat(4).map((_, i) => (
              <Skeleton key={i} height={56} radius={12} />
            ))}
          </div>
        ))}
      </div>

      <div className="sk-stats sk-stats--week">
        {repeat(3).map((_, i) => (
          <Skeleton key={i} height={130} radius={16} />
        ))}
      </div>
    </div>
  );
}

export function RoutinesSkeleton() {
  return (
    <div className="sk-page">
      <HeaderSk />
      <Skeleton height={44} radius={12} className="sk-mb" />
      <div className="sk-routines">
        <div className="sk-stack">
          {repeat(4).map((_, i) => (
            <Skeleton key={i} height={118} radius={16} />
          ))}
        </div>
        <Skeleton height={240} radius={16} />
      </div>
    </div>
  );
}

export function TodoSkeleton() {
  return (
    <div className="sk-page">
      <HeaderSk />
      <div className="sk-todo">
        <Skeleton height={300} radius={16} className="sk-todo__side" />
        <div className="sk-grid">
          {repeat(6).map((_, i) => (
            <Skeleton key={i} height={110} radius={16} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function EventsSkeleton() {
  return (
    <div className="sk-page">
      <HeaderSk />
      <Skeleton height={40} radius={12} className="sk-mb" />
      <Skeleton height={460} radius={16} />
    </div>
  );
}

export function PomodoroSkeleton() {
  return (
    <div className="sk-page">
      <HeaderSk button={false} />
      <div className="sk-pomo">
        <Skeleton height={420} radius={16} />
        <div className="sk-stack">
          <Skeleton height={220} radius={16} />
          <Skeleton height={150} radius={16} />
        </div>
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="sk-page">
      <HeaderSk button={false} />
      <div className="sk-stack sk-settings">
        {repeat(5).map((_, i) => (
          <Skeleton key={i} height={110} radius={16} />
        ))}
      </div>
    </div>
  );
}
