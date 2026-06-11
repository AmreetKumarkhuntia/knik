/* WorkflowHub.jsx — dashboard with metrics + workflows table + executions */

const knikWorkflows = [
  {
    id: "wf-1",
    name: "Daily digest",
    last: "Today · 09:00",
    status: "active",
    total: 1247,
  },
  {
    id: "wf-2",
    name: "Summarise inbox",
    last: "Today · 08:14",
    status: "active",
    total: 582,
  },
  {
    id: "wf-3",
    name: "Voice notes → tasks",
    last: "Yesterday",
    status: "active",
    total: 311,
  },
  {
    id: "wf-4",
    name: "Code review bot",
    last: "Mar 18",
    status: "paused",
    total: 97,
  },
  {
    id: "wf-5",
    name: "GitHub digest",
    last: "Mar 12",
    status: "active",
    total: 44,
  },
];

const knikExecutions = [
  {
    id: "ex-9210",
    wf: "Daily digest",
    status: "success",
    dur: "12.4s",
    at: "12:41:08",
  },
  {
    id: "ex-9209",
    wf: "Summarise inbox",
    status: "success",
    dur: "8.1s",
    at: "12:38:52",
  },
  {
    id: "ex-9208",
    wf: "Voice notes → tasks",
    status: "running",
    dur: "—",
    at: "12:37:14",
  },
  {
    id: "ex-9207",
    wf: "GitHub digest",
    status: "failed",
    dur: "4.7s",
    at: "12:31:09",
  },
  {
    id: "ex-9206",
    wf: "Daily digest",
    status: "success",
    dur: "11.9s",
    at: "12:18:32",
  },
];

function WorkflowHub({ onOpenBuilder }) {
  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "28px 32px" }}>
        {/* Metrics row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 14,
            marginBottom: 28,
          }}
        >
          <MetricCard
            icon="account_tree"
            label="Total workflows"
            value="128"
            trend={{ direction: "up", value: "+12%" }}
            color="primary"
            animDelay={0}
          />
          <MetricCard
            icon="bolt"
            label="Executions today"
            value="12,847"
            trend={{ direction: "up", value: "+5.2%" }}
            color="teal"
            animDelay={80}
          />
          <MetricCard
            icon="check_circle"
            label="Success rate"
            value="98.4%"
            trend={{ direction: "flat", value: "Steady" }}
            color="success"
            animDelay={160}
          />
        </div>

        {/* Workflows section */}
        <SectionHeader title="Workflows" action="View all" />
        <Card padding="none" style={{ marginBottom: 28, overflow: "hidden" }}>
          <Table
            columns={[
              { key: "name", label: "Name", width: "auto" },
              { key: "last", label: "Last executed", width: 180 },
              { key: "status", label: "Status", width: 110 },
              { key: "total", label: "Executions", width: 130, align: "right" },
              { key: "actions", label: "", width: 90, align: "right" },
            ]}
            rows={knikWorkflows.map((wf) => ({
              ...wf,
              name: (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: "var(--bg-surface-3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--aurora-300)",
                    }}
                  >
                    <MS name="account_tree" size={16} />
                  </div>
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: "var(--fg-1)",
                      letterSpacing: "-0.012em",
                    }}
                  >
                    {wf.name}
                  </span>
                </div>
              ),
              status: (
                <StatusBadge
                  status={wf.status === "active" ? "success" : "pending"}
                  size="sm"
                />
              ),
              total: (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12.5,
                    color: "var(--fg-2)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {wf.total.toLocaleString()}
                </span>
              ),
              actions: (
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    justifyContent: "flex-end",
                  }}
                >
                  <IconButton
                    size={28}
                    icon={<MS name="edit" size={15} />}
                    title="Edit"
                    onClick={onOpenBuilder}
                  />
                  <IconButton
                    size={28}
                    icon={<MS name="delete" size={15} />}
                    title="Delete"
                  />
                </div>
              ),
            }))}
          />
        </Card>

        {/* Recent executions */}
        <SectionHeader title="Recent executions" action="View all" />
        <Card padding="none" style={{ overflow: "hidden" }}>
          <Table
            columns={[
              { key: "id", label: "ID", width: 110 },
              { key: "wf", label: "Workflow", width: "auto" },
              { key: "status", label: "Status", width: 120 },
              { key: "dur", label: "Duration", width: 110, align: "right" },
              { key: "at", label: "Started", width: 120, align: "right" },
            ]}
            rows={knikExecutions.map((ex) => ({
              ...ex,
              id: (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--aurora-300)",
                  }}
                >
                  {ex.id}
                </span>
              ),
              wf: (
                <span style={{ fontSize: 13.5, color: "var(--fg-1)" }}>
                  {ex.wf}
                </span>
              ),
              status: <StatusBadge status={ex.status} size="sm" />,
              dur: (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--fg-3)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {ex.dur}
                </span>
              ),
              at: (
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--fg-4)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {ex.at}
                </span>
              ),
            }))}
          />
        </Card>
      </div>
    </div>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
      }}
    >
      <h2
        style={{
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: "-0.012em",
          color: "var(--fg-1)",
          margin: 0,
        }}
      >
        {title}
      </h2>
      {action && (
        <button
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--aurora-300)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {action}
          <MS name="arrow_forward" size={15} />
        </button>
      )}
    </div>
  );
}

function Table({ columns, rows }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th
              key={c.key}
              style={{
                textAlign: c.align || "left",
                padding: "12px 16px",
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--fg-4)",
                borderBottom: "1px solid var(--border-2)",
                background: "var(--bg-surface-2)",
                width: c.width,
              }}
            >
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={i}
            style={{
              transition: "background 160ms var(--ease-out)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--bg-surface-3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {columns.map((c) => (
              <td
                key={c.key}
                style={{
                  padding: "12px 16px",
                  textAlign: c.align || "left",
                  borderBottom:
                    i === rows.length - 1
                      ? "none"
                      : "1px solid var(--border-1)",
                  fontSize: 13.5,
                  color: "var(--fg-2)",
                }}
              >
                {row[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

Object.assign(window, { WorkflowHub, SectionHeader, Table });
