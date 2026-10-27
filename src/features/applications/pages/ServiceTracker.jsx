import { User, CheckCircle, RefreshCw, Timer } from "lucide-react";
import { StatusBar, BottomNav, Card, Sec, Header, Btn, Empty } from "@/components/ui";
import { useT, useC } from "@/hooks/useUi";
import { useTrackerView } from "@/features/applications/hooks/useTrackerView";
import { useApplicationsQuery } from "@/features/applications/hooks/useApplications";
import { LoadingState } from "@/components/feedback/states";
import { StepRail } from "@/components/feedback/StepRail";

const ServiceTracker = ({ onNav, goBack }) => {
  const c = useC();
  const t = useT();
  const view = useTrackerView();
  // "Check for updates" only re-reads the status; officers move applications.
  const applications = useApplicationsQuery();
  const tone = view.statusTone === "ok" ? c.ok : view.statusTone === "err" ? c.err : c.warn;

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 90 }}>
      <StatusBar />
      <div style={{ padding: "8px 20px" }}>
        <Header title="Service Tracker" onBack={goBack} />

        {view.loading ? (
          <LoadingState label="Loading your application…" />
        ) : !view.hasApp ? (
          <Empty icon={Timer} title="No applications yet" desc="Apply for a service to track it here" />
        ) : (
          <>
            <Card style={{ marginBottom: 20, background: `linear-gradient(135deg,${c.pri}08,${c.sec}0D), ${c.card}`, border: `1px solid ${c.pri}15` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontSize: 10, color: c.txt3, letterSpacing: 1, textTransform: "uppercase" }}>Application</p>
                  <p style={{ fontSize: 17, fontWeight: 800, marginTop: 4, color: c.txt }}>{view.title}</p>
                  <p className="v-num" style={{ fontSize: 12, color: c.txt2, fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace" }}>{view.ref}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: tone, padding: "4px 10px", background: `${tone}15`, borderRadius: 9999 }}>{t(view.status)}</span>
              </div>
              {view.timeline.length > 0 && (() => {
                // The whole journey at a glance, in the same rail the home screen uses.
                const steps = view.timeline.length;
                const at = view.timeline.findIndex((x) => x.s === "current");
                const complete = at < 0 && view.timeline.every((x) => x.s === "done");
                const step = complete ? steps : at >= 0 ? at + 1 : Math.max(view.timeline.filter((x) => x.s === "done").length, 1);
                return (
                  <div style={{ marginTop: 16 }}>
                    <StepRail steps={steps} step={step} colour={tone} complete={complete} track={c.bdr} />
                    <p className="v-num" style={{ fontSize: 11.5, color: c.txt2, marginTop: 7 }}>{complete ? "All steps complete" : `Step ${step} of ${steps}${at >= 0 ? ` · ${view.timeline[at].t}` : ""}`}</p>
                  </div>
                );
              })()}
              {view.slaDays != null && (
                <div style={{ marginTop: 16, padding: "12px 16px", background: c.card, borderRadius: 12 }}>
                  <p style={{ fontSize: 10, color: c.txt3 }}>Right to Service Deadline</p>
                  <p className="v-num" style={{ fontSize: 20, fontWeight: 800, color: c.pri, letterSpacing: "-0.02em" }}>{view.slaDays} <span style={{ fontSize: 12, fontWeight: 500 }}>days</span></p>
                </div>
              )}
            </Card>

            {view.officer && (
              <Card style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 12, color: c.txt3, marginBottom: 8 }}>Officer</p>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${c.pri}10`, display: "flex", alignItems: "center", justifyContent: "center" }}><User size={22} color={c.pri} /></div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: c.txt }}>{view.officer.name}</p>
                    <p style={{ fontSize: 12, color: c.txt2 }}>{view.officer.designation} · {view.officer.jurisdiction}</p>
                  </div>
                </div>
              </Card>
            )}

            <Sec title="Timeline" />
            <div style={{ position: "relative", paddingLeft: 24 }}>
              <div style={{ position: "absolute", left: 9, top: 12, bottom: 12, width: 2, background: c.bdr }} />
              {view.timeline.map((x, i) => (
                <div key={i} style={{ position: "relative", paddingBottom: i === view.timeline.length - 1 ? 0 : 24 }}>
                  <div style={{ position: "absolute", left: -18, top: 4, width: 16, height: 16, borderRadius: "50%", background: x.s === "done" ? c.ok : x.s === "current" ? c.pri : c.bdr, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                    {x.s === "done" && <CheckCircle size={10} color="#fff" />}
                    {x.s === "current" && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  <div style={{ paddingLeft: 8 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: x.s === "pending" ? c.txt3 : c.txt }}>{x.t}</p>
                    <p style={{ fontSize: 11, color: c.txt2, marginTop: 2 }}>{x.d}</p>
                  </div>
                </div>
              ))}
            </div>

            <Btn full variant="outline" style={{ marginTop: 24 }} icon={RefreshCw} onClick={() => applications.refetch()} disabled={applications.isFetching}>
              {applications.isFetching ? "Checking…" : "Check for updates"}
            </Btn>
          </>
        )}
      </div>
      <BottomNav active="services" onNav={onNav} />
    </div>
  );
};

export default ServiceTracker;
