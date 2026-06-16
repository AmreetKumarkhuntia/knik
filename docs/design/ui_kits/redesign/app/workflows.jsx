/* workflows.jsx — WorkflowHub dashboard + Schedules page */

function PageScroll({ children, maxWidth = 1200 }) {
  return (
    <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ maxWidth, margin: "0 auto", padding: "28px 32px 48px" }}>
        {children}
      </div>
    </div>
  );
}

function WorkflowHub({ onOpenBuilder }) {
  const [filter, setFilter] = React.useState("all");
  const [q, setQ] = React.useState("");
  const rows = KNIK.workflows.filter(
    (w) =>
      (filter === "all" || w.status === filter) &&
      w.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <PageScroll>
      {/* Metric strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(0,1fr))",
          gap: 14,
          marginBottom: 30,
        }}
      >
        {KNIK.metrics.map((m, i) => (
          <MetricCard
            key={i}
            icon={m.icon}
            label={m.label}
            value={m.value}
            sub={m.sub}
            trend={m.trend}
            color={m.color}
            animDelay={i * 70}
          />
        ))}
      </div>

      {/* Workflows */}
      <SectionHeader
        title="Workflows"
        sub={`${rows.length} of ${KNIK.workflows.length} shown`}
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SearchField
              value={q}
              onChange={setQ}
              placeholder="Search workflows…"
            />
            <Segmented
              size="sm"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All" },
                { value: "active", label: "Active" },
                { value: "paused", label: "Paused" },
              ]}
            />
          </div>
        }
      />

      <Card pad="0" style={{ overflow: "hidden", marginBottom: 30 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Workflow", "Activity", "Last run", "Status", "Runs", ""].map(
                (h, i) => (
                  <th
                    key={i}
                    style={{
                      textAlign:
                        i >= 4 ? (i === 5 ? "right" : "right") : "left",
                      padding: "11px 18px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 10.5,
                      fontWeight: 550,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "var(--fg-4)",
                      borderBottom: "1px solid var(--border-2)",
                      background: "var(--bg-surface)",
                      width:
                        i === 0
                          ? "auto"
                          : i === 1
                            ? 110
                            : i === 2
                              ? 150
                              : i === 3
                                ? 120
                                : i === 4
                                  ? 90
                                  : 90,
                    }}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((w, idx) => (
              <tr
                key={w.id}
                onClick={onOpenBuilder}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-surface-3)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                style={{
                  cursor: "pointer",
                  transition: "background 140ms var(--ease-out)",
                }}
              >
                <td
                  style={{
                    padding: "13px 18px",
                    borderBottom:
                      idx === rows.length - 1
                        ? "none"
                        : "1px solid var(--border-1)",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 12 }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "var(--r-btn,8px)",
                        background: "var(--acc-soft)",
                        color: "var(--acc-text, var(--aurora-300))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <MS name="account_tree" size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: "var(--fg-1)",
                          letterSpacing: "-0.012em",
                        }}
                      >
                        {w.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "var(--fg-4)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {w.desc}
                      </div>
                    </div>
                  </div>
                </td>
                <td
                  style={{
                    padding: "13px 18px",
                    borderBottom:
                      idx === rows.length - 1
                        ? "none"
                        : "1px solid var(--border-1)",
                  }}
                >
                  <Sparkline
                    data={w.spark}
                    w={84}
                    h={26}
                    color={
                      w.status === "paused"
                        ? "var(--fg-4)"
                        : "var(--acc, var(--aurora-400))"
                    }
                  />
                </td>
                <td
                  style={{
                    padding: "13px 18px",
                    borderBottom:
                      idx === rows.length - 1
                        ? "none"
                        : "1px solid var(--border-1)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--fg-3)",
                  }}
                >
                  {w.last}
                </td>
                <td
                  style={{
                    padding: "13px 18px",
                    borderBottom:
                      idx === rows.length - 1
                        ? "none"
                        : "1px solid var(--border-1)",
                  }}
                >
                  <StatusBadge status={w.status} size="sm" />
                </td>
                <td
                  style={{
                    padding: "13px 18px",
                    textAlign: "right",
                    borderBottom:
                      idx === rows.length - 1
                        ? "none"
                        : "1px solid var(--border-1)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 12.5,
                    color: "var(--fg-2)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {w.total.toLocaleString()}
                </td>
                <td
                  style={{
                    padding: "13px 18px",
                    textAlign: "right",
                    borderBottom:
                      idx === rows.length - 1
                        ? "none"
                        : "1px solid var(--border-1)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 2,
                      justifyContent: "flex-end",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconButton
                      size={30}
                      icon={<MS name="edit" size={15} />}
                      title="Edit"
                      onClick={onOpenBuilder}
                    />
                    <IconButton
                      size={30}
                      icon={
                        <MS
                          name={w.status === "paused" ? "play_arrow" : "pause"}
                          size={16}
                        />
                      }
                      title={w.status === "paused" ? "Resume" : "Pause"}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Recent executions */}
      <SectionHeader title="Recent executions" action="View all" />
      <Card pad="0" style={{ overflow: "hidden" }}>
        {KNIK.executions.map((ex, i) => (
          <div
            key={ex.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "13px 18px",
              borderBottom:
                i === KNIK.executions.length - 1
                  ? "none"
                  : "1px solid var(--border-1)",
            }}
          >
            <MS
              name={
                ex.status === "success"
                  ? "check_circle"
                  : ex.status === "failed"
                    ? "cancel"
                    : "pending"
              }
              size={18}
              fill={1}
              style={{
                color:
                  ex.status === "success"
                    ? "var(--success)"
                    : ex.status === "failed"
                      ? "var(--danger)"
                      : "var(--info)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--acc-text, var(--aurora-300))",
                width: 84,
                flexShrink: 0,
              }}
            >
              {ex.id}
            </span>
            <span
              style={{
                fontSize: 13.5,
                color: "var(--fg-1)",
                flex: 1,
                minWidth: 0,
                fontWeight: 500,
              }}
            >
              {ex.wf}
            </span>
            <StatusBadge status={ex.status} size="sm" />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--fg-3)",
                width: 56,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {ex.dur}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--fg-5)",
                width: 72,
                textAlign: "right",
              }}
            >
              {ex.at}
            </span>
          </div>
        ))}
      </Card>
    </PageScroll>
  );
}

function SearchField({ value, onChange, placeholder }) {
  const [f, setF] = React.useState(false);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 11px",
        width: 220,
        borderRadius: "var(--r-btn,8px)",
        background: "var(--bg-surface)",
        border: `1px solid ${f ? "var(--acc-border, rgba(0,217,244,0.45))" : "var(--border-2)"}`,
        transition: "all 150ms var(--ease-out)",
      }}
    >
      <MS name="search" size={16} style={{ color: "var(--fg-4)" }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setF(true)}
        onBlur={() => setF(false)}
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          background: "transparent",
          color: "var(--fg-1)",
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          minWidth: 0,
        }}
      />
    </div>
  );
}

function Schedules() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <PageScroll maxWidth={1100}>
      <SectionHeader
        title="Schedules"
        sub="Cron-triggered workflow runs"
        right={
          <Button
            variant="primary"
            size="sm"
            icon={<MS name="add" size={16} />}
          >
            New schedule
          </Button>
        }
      />

      {/* Upcoming strip */}
      <Card style={{ marginBottom: 26 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--fg-1)" }}>
            This week
          </div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--fg-4)",
            }}
          >
            Mar 16 – 22 · UTC
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,1fr)",
            gap: 8,
          }}
        >
          {days.map((d, i) => {
            const count = [3, 4, 3, 3, 5, 1, 1][i];
            const today = i === 1;
            return (
              <div
                key={d}
                style={{
                  borderRadius: "var(--r-btn,8px)",
                  border: `1px solid ${today ? "var(--acc-border, rgba(0,217,244,0.4))" : "var(--border-1)"}`,
                  background: today ? "var(--acc-soft)" : "var(--bg-surface)",
                  padding: "10px 10px 12px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    color: today
                      ? "var(--acc-text, var(--aurora-300))"
                      : "var(--fg-4)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {d}
                </div>
                <div
                  style={{
                    fontSize: 19,
                    fontWeight: 600,
                    color: "var(--fg-1)",
                    marginTop: 4,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {16 + i}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 3,
                    justifyContent: "center",
                    marginTop: 8,
                    flexWrap: "wrap",
                    minHeight: 8,
                  }}
                >
                  {Array.from({ length: count }).map((_, k) => (
                    <span
                      key={k}
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: today
                          ? "var(--acc, var(--aurora-400))"
                          : "var(--fg-5)",
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card pad="0" style={{ overflow: "hidden" }}>
        {KNIK.schedules.map((s, i) => (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "15px 18px",
              borderBottom:
                i === KNIK.schedules.length - 1
                  ? "none"
                  : "1px solid var(--border-1)",
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--r-btn,8px)",
                flexShrink: 0,
                background:
                  s.status === "active"
                    ? "var(--acc-soft)"
                    : "var(--bg-surface-3)",
                color:
                  s.status === "active"
                    ? "var(--acc-text, var(--aurora-300))"
                    : "var(--fg-4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MS name="schedule" size={19} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--fg-1)",
                }}
              >
                {s.wf}
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-4)", marginTop: 1 }}>
                {s.human}
              </div>
            </div>
            <code
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--fg-2)",
                background: "var(--bg-code)",
                border: "1px solid var(--border-1)",
                padding: "4px 9px",
                borderRadius: 6,
              }}
            >
              {s.cron}
            </code>
            <div style={{ width: 150, textAlign: "right" }}>
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--fg-2)",
                  fontWeight: 500,
                }}
              >
                {s.next}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  color: "var(--fg-5)",
                }}
              >
                {s.tz}
              </div>
            </div>
            <StatusBadge status={s.status} size="sm" />
            <Toggle checked={s.status === "active"} onChange={() => {}} />
          </div>
        ))}
      </Card>
    </PageScroll>
  );
}

Object.assign(window, { WorkflowHub, Schedules, PageScroll, SearchField });
