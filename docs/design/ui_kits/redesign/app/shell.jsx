/* shell.jsx — redesigned Sidebar (collapsible, sectioned) + command-bar TopBar + MainLayout */

const NAV = [
  { key: "chat", label: "Chat", icon: "forum" },
  { key: "workflows", label: "Workflows", icon: "account_tree" },
  { key: "builder", label: "Builder", icon: "polyline" },
  { key: "schedules", label: "Schedules", icon: "schedule" },
];

function Sidebar({
  view,
  onNavigate,
  onNewChat,
  collapsed,
  onToggle,
  onOpenSearch,
}) {
  const W = collapsed ? 76 : 264;
  const recents = KNIK.recents;

  const NavItem = ({ k, label, icon }) => {
    const active = view === k;
    const [h, setH] = React.useState(false);
    return (
      <button
        type="button"
        onClick={() => onNavigate(k)}
        title={collapsed ? label : undefined}
        onMouseEnter={() => setH(true)}
        onMouseLeave={() => setH(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          position: "relative",
          padding: collapsed ? 0 : "9px 11px",
          height: collapsed ? 44 : "auto",
          width: collapsed ? 44 : "100%",
          marginInline: collapsed ? "auto" : 0,
          justifyContent: collapsed ? "center" : "flex-start",
          borderRadius: "var(--r-btn,8px)",
          border: "none",
          cursor: "pointer",
          background: active
            ? "var(--acc-soft)"
            : h
              ? "var(--bg-surface-3)"
              : "transparent",
          color: active
            ? "var(--acc-text, var(--aurora-200))"
            : h
              ? "var(--fg-1)"
              : "var(--fg-3)",
          fontSize: 13.5,
          fontWeight: 550,
          letterSpacing: "-0.01em",
          transition: "all 160ms var(--ease-out)",
        }}
      >
        {active && !collapsed && (
          <span
            style={{
              position: "absolute",
              left: -14,
              top: "50%",
              transform: "translateY(-50%)",
              width: 3,
              height: 18,
              borderRadius: 999,
              background: "var(--acc, var(--aurora-400))",
            }}
          />
        )}
        <MS name={icon} size={20} fill={active ? 1 : 0} />
        {!collapsed && <span>{label}</span>}
      </button>
    );
  };

  return (
    <aside
      style={{
        width: W,
        flexShrink: 0,
        height: "100%",
        background: "var(--bg-glass)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        borderRight: "1px solid var(--border-2)",
        display: "flex",
        flexDirection: "column",
        padding: collapsed ? "16px 16px" : "16px 14px",
        transition: "width 260ms var(--ease-out)",
        overflow: "hidden",
      }}
    >
      {/* Brand / workspace switcher */}
      <button
        type="button"
        onClick={onToggle}
        title={collapsed ? "Expand" : "Collapse"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          padding: collapsed ? 0 : "4px 6px",
          marginBottom: 14,
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            flexShrink: 0,
            background: "rgba(11,18,26,0.7)",
            border: "1px solid var(--acc-border, rgba(0,217,244,0.4))",
            boxShadow: "0 0 24px -6px var(--acc-glow, rgba(0,217,244,0.55))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <KnikGlyph size={22} />
        </div>
        {!collapsed && (
          <div style={{ textAlign: "left", minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: 16,
                letterSpacing: "-0.025em",
                color: "var(--fg-1)",
                lineHeight: 1.1,
              }}
            >
              Knik AI
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                color: "var(--fg-4)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--success)",
                }}
              />
              Local · running
            </div>
          </div>
        )}
        {!collapsed && (
          <MS name="unfold_more" size={16} style={{ color: "var(--fg-5)" }} />
        )}
      </button>

      {/* New chat + search */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          onClick={onNewChat}
          title={collapsed ? "New chat" : undefined}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? 0 : "9px 12px",
            height: collapsed ? 44 : "auto",
            width: collapsed ? 44 : "100%",
            marginInline: collapsed ? "auto" : 0,
            borderRadius: "var(--r-btn,8px)",
            border: "1px solid var(--acc-border, rgba(0,217,244,0.35))",
            cursor: "pointer",
            background: "var(--acc-soft)",
            color: "var(--acc-text, var(--aurora-200))",
            fontSize: 13.5,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            transition: "all 160ms var(--ease-out)",
          }}
        >
          <MS name="add" size={20} />
          {!collapsed && "New chat"}
        </button>
        {!collapsed && (
          <button
            type="button"
            onClick={onOpenSearch}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "8px 12px",
              width: "100%",
              borderRadius: "var(--r-btn,8px)",
              border: "1px solid var(--border-2)",
              cursor: "pointer",
              background: "var(--bg-surface)",
              color: "var(--fg-4)",
              fontSize: 13,
              transition: "all 160ms var(--ease-out)",
            }}
          >
            <MS name="search" size={18} />
            <span style={{ flex: 1, textAlign: "left" }}>Search…</span>
            <Kbd>⌘K</Kbd>
          </button>
        )}
      </div>

      {/* Nav */}
      {!collapsed && <Eyebrow>Workspace</Eyebrow>}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((n) => (
          <NavItem key={n.key} k={n.key} label={n.label} icon={n.icon} />
        ))}
      </div>

      {/* Recents */}
      {!collapsed ? (
        <div
          style={{
            marginTop: 18,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            flex: 1,
          }}
        >
          <Eyebrow>Recent chats</Eyebrow>
          <div
            className="hide-scrollbar"
            style={{
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {recents.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onNavigate("chat")}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--bg-surface-3)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                style={{
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  padding: "7px 11px",
                  borderRadius: "var(--r-btn,8px)",
                  cursor: "pointer",
                  transition: "background 140ms var(--ease-out)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {c.pinned && (
                    <MS
                      name="keep"
                      size={12}
                      fill={1}
                      style={{ color: "var(--acc-text, var(--aurora-300))" }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 550,
                      color: "var(--fg-2)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flex: 1,
                    }}
                  >
                    {c.title}
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--fg-5)",
                      flexShrink: 0,
                    }}
                  >
                    {c.at}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: "var(--fg-4)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginTop: 1,
                    paddingLeft: c.pinned ? 18 : 0,
                  }}
                >
                  {c.preview}
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      {/* Footer: account */}
      <div
        style={{
          marginTop: 10,
          paddingTop: 12,
          borderTop: "1px solid var(--border-1)",
        }}
      >
        <button
          type="button"
          onClick={() => onNavigate("settings")}
          title={collapsed ? "Settings & account" : undefined}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--bg-surface-3)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: collapsed ? 44 : "100%",
            marginInline: collapsed ? "auto" : 0,
            padding: collapsed ? 0 : "8px 8px",
            height: collapsed ? 44 : "auto",
            justifyContent: collapsed ? "center" : "flex-start",
            borderRadius: "var(--r-btn,8px)",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            transition: "background 140ms var(--ease-out)",
          }}
        >
          <Avatar
            initials={KNIK.account.initials}
            size={collapsed ? 32 : 30}
            color="accent"
          />
          {!collapsed && (
            <div style={{ textAlign: "left", flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "var(--fg-1)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {KNIK.account.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--fg-4)" }}>
                Local account
              </div>
            </div>
          )}
          {!collapsed && (
            <MS name="settings" size={17} style={{ color: "var(--fg-4)" }} />
          )}
        </button>
      </div>
    </aside>
  );
}

function Eyebrow({ children }) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        color: "var(--fg-4)",
        padding: "10px 11px 7px",
      }}
    >
      {children}
    </div>
  );
}

function TopBar({
  crumbs = [],
  right,
  onOpenSearch,
  dark,
  onToggleTheme,
  notif = 3,
}) {
  return (
    <header
      style={{
        height: 64,
        paddingInline: 24,
        display: "flex",
        alignItems: "center",
        gap: 20,
        background: "var(--bg-glass)",
        backdropFilter: "blur(20px) saturate(140%)",
        WebkitBackdropFilter: "blur(20px) saturate(140%)",
        borderBottom: "1px solid var(--border-2)",
        flexShrink: 0,
        position: "relative",
        zIndex: 5,
      }}
    >
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {crumbs.map((b, i) => (
          <React.Fragment key={i}>
            <span
              style={{
                color: i === crumbs.length - 1 ? "var(--fg-1)" : "var(--fg-4)",
                fontWeight: i === crumbs.length - 1 ? 600 : 500,
                letterSpacing: "-0.012em",
              }}
            >
              {b}
            </span>
            {i < crumbs.length - 1 && (
              <span style={{ color: "var(--fg-5)", fontSize: 13 }}>/</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Command field */}
      <button
        type="button"
        onClick={onOpenSearch}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--border-3)";
          e.currentTarget.style.background = "var(--bg-surface-2)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-2)";
          e.currentTarget.style.background = "var(--bg-surface)";
        }}
        style={{
          flex: 1,
          maxWidth: 460,
          marginInline: "auto",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          borderRadius: "var(--r-btn,8px)",
          border: "1px solid var(--border-2)",
          background: "var(--bg-surface)",
          color: "var(--fg-4)",
          fontSize: 13,
          cursor: "pointer",
          transition: "all 160ms var(--ease-out)",
        }}
      >
        <MS name="search" size={18} />
        <span style={{ flex: 1, textAlign: "left" }}>
          Search or run a command…
        </span>
        <Kbd>⌘K</Kbd>
      </button>

      <div
        style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}
      >
        {right}
        <div
          style={{
            width: 1,
            height: 22,
            background: "var(--border-2)",
            marginInline: 4,
          }}
        />
        <IconButton
          title={dark ? "Light mode" : "Dark mode"}
          onClick={onToggleTheme}
          icon={<MS name={dark ? "light_mode" : "dark_mode"} size={19} />}
        />
        <div style={{ position: "relative" }}>
          <IconButton
            title="Notifications"
            icon={<MS name="notifications" size={19} />}
          />
          {notif > 0 && (
            <span
              style={{
                position: "absolute",
                top: 5,
                right: 5,
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--acc, var(--aurora-400))",
                border: "1.5px solid var(--bg-base)",
              }}
            />
          )}
        </div>
      </div>
    </header>
  );
}

Object.assign(window, { Sidebar, TopBar, NAV });
