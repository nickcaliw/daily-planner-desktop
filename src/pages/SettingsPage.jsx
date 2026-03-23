import { useCallback, useEffect, useState } from "react";

const settingsApi = typeof window !== "undefined" ? window.settingsApi : null;
const dataApi = typeof window !== "undefined" ? window.dataApi : null;
const notificationApi = typeof window !== "undefined" ? window.notificationApi : null;
const dialogApi = typeof window !== "undefined" ? window.dialogApi : null;
const plannerApi = typeof window !== "undefined" ? window.plannerApi : null;
const mfpApi = typeof window !== "undefined" ? window.mfpApi : null;

const APP_NAME = "Daily Planner";
const APP_VERSION = "1.0.0";

export default function SettingsPage() {
  const [waterReminder, setWaterReminder] = useState(false);
  const [bedtimeReminder, setBedtimeReminder] = useState(false);
  const [supplementReminder, setSupplementReminder] = useState(false);
  const [lastBackup, setLastBackup] = useState(null);
  const [message, setMessage] = useState(null); // { type: "success"|"error", text }
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [mfpImporting, setMfpImporting] = useState(false);

  // Load settings on mount
  useEffect(() => {
    async function load() {
      if (!settingsApi) return;
      const water = await settingsApi.get("waterReminder");
      const bedtime = await settingsApi.get("bedtimeReminder");
      const supplement = await settingsApi.get("supplementReminder");
      const backup = await settingsApi.get("lastBackupDate");
      if (water !== undefined) setWaterReminder(!!water);
      if (bedtime !== undefined) setBedtimeReminder(!!bedtime);
      if (supplement !== undefined) setSupplementReminder(!!supplement);
      if (backup) setLastBackup(backup);
    }
    load();
  }, []);

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  // --- Data Management ---

  const handleExport = async () => {
    if (!dataApi) return;
    setExporting(true);
    try {
      const data = await dataApi.export();
      const filePath = await dataApi.saveJson("daily-planner-backup");
      if (!filePath) {
        setExporting(false);
        return; // user cancelled
      }
      await dataApi.writeFile(filePath, JSON.stringify(data, null, 2));
      const now = new Date().toISOString();
      if (settingsApi) await settingsApi.set("lastBackupDate", now);
      setLastBackup(now);
      showMessage("success", "Data exported successfully!");
    } catch (err) {
      showMessage("error", "Export failed: " + (err.message || err));
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!dataApi) return;
    setImporting(true);
    try {
      const jsonStr = await dataApi.openJson();
      if (!jsonStr) {
        setImporting(false);
        return; // user cancelled
      }
      const data = JSON.parse(jsonStr);
      await dataApi.import(data);
      showMessage("success", "Data imported successfully!");
    } catch (err) {
      showMessage("error", "Import failed: " + (err.message || err));
    } finally {
      setImporting(false);
    }
  };

  // --- MyFitnessPal CSV Import ---

  const handleMfpImport = async () => {
    if (!mfpApi || !plannerApi) return;
    setMfpImporting(true);
    try {
      const days = await mfpApi.parsePdf();
      if (!days) {
        setMfpImporting(false);
        return; // user cancelled
      }

      if (days.length === 0) {
        showMessage("error", "No nutrition data found in PDF. Make sure it's a MyFitnessPal Printable Diary.");
        setMfpImporting(false);
        return;
      }

      // Save each day's nutrition into planner
      let saved = 0;
      for (const day of days) {
        const existing = await plannerApi.getDay(day.date);
        const entry = existing || {
          date: day.date, tab: "planner",
          grateful: "", feel: "", goal: "",
          agenda: {}, top3: ["", "", ""], notes: "",
          wins: ["", "", ""], rating: 3, habits: {},
          nutrition: { calories: "", protein: "", carbs: "", fat: "" },
        };
        entry.nutrition = {
          calories: String(day.calories),
          protein: String(day.protein),
          carbs: String(day.carbs),
          fat: String(day.fat),
        };
        await plannerApi.saveDay(day.date, entry);
        saved++;
      }

      showMessage("success", `Imported nutrition data for ${saved} days from MyFitnessPal!`);
    } catch (err) {
      showMessage("error", "MFP import failed: " + (err.message || err));
    } finally {
      setMfpImporting(false);
    }
  };

  // --- Notification Toggles ---

  const toggleSetting = async (key, value, setter) => {
    setter(value);
    if (settingsApi) await settingsApi.set(key, value);
  };

  const handleTestNotification = () => {
    if (notificationApi) {
      notificationApi.send("Daily Planner", "Notifications are working!");
    }
  };

  // Format last backup date
  const formattedBackup = lastBackup
    ? new Date(lastBackup).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Never";

  return (
    <div className="settPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Settings</h1>
        </div>
      </div>

      <div className="settBody">
        {/* Status message */}
        {message && (
          <div className={`settMsg ${message.type === "error" ? "settMsgError" : "settMsgSuccess"}`}>
            {message.text}
          </div>
        )}

        {/* Data Management */}
        <section className="settSection">
          <h2 className="settSectionTitle">Data Management</h2>
          <div className="settCard">
            <div className="settRow">
              <div className="settRowInfo">
                <div className="settLabel">Export Data</div>
                <div className="settDesc">Save all your planner data as a JSON backup file.</div>
              </div>
              <button
                className="btn btnPrimary"
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? "Exporting..." : "Export"}
              </button>
            </div>

            <div className="settDivider" />

            <div className="settRow">
              <div className="settRowInfo">
                <div className="settLabel">Import Data</div>
                <div className="settDesc">Restore data from a previously exported JSON file.</div>
              </div>
              <button
                className="btn btnPrimary"
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? "Importing..." : "Import"}
              </button>
            </div>

            <div className="settDivider" />

            <div className="settRow">
              <div className="settRowInfo">
                <div className="settLabel">Last Backup</div>
                <div className="settDesc">{formattedBackup}</div>
              </div>
            </div>
          </div>
        </section>

        {/* MyFitnessPal Import */}
        <section className="settSection">
          <h2 className="settSectionTitle">MyFitnessPal Import</h2>
          <div className="settCard">
            <div className="settRow">
              <div className="settRowInfo">
                <div className="settLabel">Import Nutrition Data</div>
                <div className="settDesc">
                  Import a MyFitnessPal Printable Diary PDF to auto-populate daily calories, protein, carbs, and fat for each day.
                </div>
              </div>
              <button
                className="btn btnPrimary"
                onClick={handleMfpImport}
                disabled={mfpImporting}
              >
                {mfpImporting ? "Importing..." : "Import PDF"}
              </button>
            </div>

            <div className="settDivider" />

            <div className="settRow">
              <div className="settRowInfo">
                <div className="settDesc" style={{ fontSize: "12px", color: "var(--muted)" }}>
                  To export from MyFitnessPal: go to myfitnesspal.com → Food Diary → select a date range → Print → Save as PDF. The PDF should show daily totals with Calories, Carbs, Fat, and Protein.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="settSection">
          <h2 className="settSectionTitle">Notifications</h2>
          <div className="settCard">
            <div className="settRow">
              <div className="settRowInfo">
                <div className="settLabel">Water Reminders</div>
                <div className="settDesc">Get reminded to drink water every 2 hours.</div>
              </div>
              <label className="settToggle">
                <input
                  type="checkbox"
                  checked={waterReminder}
                  onChange={(e) => toggleSetting("waterReminder", e.target.checked, setWaterReminder)}
                />
                <span className="settToggleTrack" />
              </label>
            </div>

            <div className="settDivider" />

            <div className="settRow">
              <div className="settRowInfo">
                <div className="settLabel">Bedtime Reminder</div>
                <div className="settDesc">Get a reminder when it's time to wind down.</div>
              </div>
              <label className="settToggle">
                <input
                  type="checkbox"
                  checked={bedtimeReminder}
                  onChange={(e) => toggleSetting("bedtimeReminder", e.target.checked, setBedtimeReminder)}
                />
                <span className="settToggleTrack" />
              </label>
            </div>

            <div className="settDivider" />

            <div className="settRow">
              <div className="settRowInfo">
                <div className="settLabel">Supplement Reminder</div>
                <div className="settDesc">Daily reminder to take your supplements.</div>
              </div>
              <label className="settToggle">
                <input
                  type="checkbox"
                  checked={supplementReminder}
                  onChange={(e) => toggleSetting("supplementReminder", e.target.checked, setSupplementReminder)}
                />
                <span className="settToggleTrack" />
              </label>
            </div>

            <div className="settDivider" />

            <div className="settRow">
              <div className="settRowInfo">
                <div className="settLabel">Test Notification</div>
                <div className="settDesc">Send a test notification to verify they work.</div>
              </div>
              <button className="btn btnPrimary" onClick={handleTestNotification}>
                Test
              </button>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="settSection">
          <h2 className="settSectionTitle">About</h2>
          <div className="settCard">
            <div className="settRow">
              <div className="settRowInfo">
                <div className="settLabel">{APP_NAME}</div>
                <div className="settDesc">Version {APP_VERSION}</div>
              </div>
            </div>

            <div className="settDivider" />

            <div className="settRow">
              <div className="settRowInfo">
                <div className="settDesc">Built with Electron + React</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
