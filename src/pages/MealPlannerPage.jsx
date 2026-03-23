import { useCallback, useEffect, useMemo, useState } from "react";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const mealsApi = typeof window !== "undefined" ? window.mealsApi : null;
const CATEGORIES = ["breakfast", "lunch", "dinner", "snack"];
const CATEGORY_LABELS = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

const EMPTY_FORM = {
  name: "",
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  category: "breakfast",
  ingredients: "",
  notes: "",
};

export default function MealPlannerPage() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [todayLog, setTodayLog] = useState([]);

  const loadMeals = useCallback(async () => {
    if (!mealsApi) return;
    const list = await mealsApi.list();
    setMeals(list ?? []);
  }, []);

  useEffect(() => {
    loadMeals().then(() => setLoading(false));
  }, [loadMeals]);

  const filteredMeals = useMemo(() => {
    let result = meals;
    if (filterCategory !== "all") {
      result = result.filter((m) => m.category === filterCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((m) => m.name.toLowerCase().includes(q));
    }
    return result;
  }, [meals, filterCategory, search]);

  const todayTotals = useMemo(() => {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const entry of todayLog) {
      totals.calories += Number(entry.calories) || 0;
      totals.protein += Number(entry.protein) || 0;
      totals.carbs += Number(entry.carbs) || 0;
      totals.fat += Number(entry.fat) || 0;
    }
    return totals;
  }, [todayLog]);

  const openAddForm = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const openEditForm = (meal) => {
    setEditingId(meal.id);
    setForm({
      name: meal.name || "",
      calories: meal.calories ?? "",
      protein: meal.protein ?? "",
      carbs: meal.carbs ?? "",
      fat: meal.fat ?? "",
      category: meal.category || "breakfast",
      ingredients: meal.ingredients || "",
      notes: meal.notes || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
  };

  const [formErrors, setFormErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Meal name is required";
    if (form.calories && (isNaN(Number(form.calories)) || Number(form.calories) < 0)) errors.calories = "Must be a positive number";
    if (form.protein && (isNaN(Number(form.protein)) || Number(form.protein) < 0)) errors.protein = "Must be a positive number";
    if (form.carbs && (isNaN(Number(form.carbs)) || Number(form.carbs) < 0)) errors.carbs = "Must be a positive number";
    if (form.fat && (isNaN(Number(form.fat)) || Number(form.fat) < 0)) errors.fat = "Must be a positive number";
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const id = editingId ?? crypto.randomUUID();
    const data = {
      id,
      name: form.name.trim(),
      calories: form.calories,
      protein: form.protein,
      carbs: form.carbs,
      fat: form.fat,
      category: form.category,
      ingredients: form.ingredients.trim(),
      notes: form.notes.trim(),
    };
    if (mealsApi) await mealsApi.save(id, data);
    await loadMeals();
    closeForm();
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const handleDelete = async (id) => {
    if (mealsApi) await mealsApi.delete(id);
    setConfirmDeleteId(null);
    await loadMeals();
  };

  const quickLog = (meal) => {
    setTodayLog((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        category: meal.category,
      },
    ]);
  };

  const removeLog = (logId) => {
    setTodayLog((prev) => prev.filter((e) => e.id !== logId));
  };

  if (loading) {
    return (
      <div className="mealPage">
        <div className="topbar">
          <div className="topbarLeft">
            <h1 className="pageTitle">Meal Planner</h1>
          </div>
        </div>
        <div className="loadingMsg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mealPage">
      <div className="topbar">
        <div className="topbarLeft">
          <h1 className="pageTitle">Meal Planner</h1>
          <div className="weekBadge">{meals.length} meals saved</div>
        </div>
        <div className="nav">
          <button className="btn btnPrimary" onClick={openAddForm} type="button">
            + Add Meal
          </button>
        </div>
      </div>

      <div className="mealContent">
        {/* Today's Nutrition Log */}
        {todayLog.length > 0 && (
          <div className="mealTodayLog">
            <div className="mealTodayTitle">Today's Nutrition</div>
            <div className="mealTodayTotals">
              <div className="mealTodayStat">
                <span className="mealTodayStatValue">{todayTotals.calories}</span>
                <span className="mealTodayStatLabel">cal</span>
              </div>
              <div className="mealTodayStat">
                <span className="mealTodayStatValue">{todayTotals.protein}g</span>
                <span className="mealTodayStatLabel">protein</span>
              </div>
              <div className="mealTodayStat">
                <span className="mealTodayStatValue">{todayTotals.carbs}g</span>
                <span className="mealTodayStatLabel">carbs</span>
              </div>
              <div className="mealTodayStat">
                <span className="mealTodayStatValue">{todayTotals.fat}g</span>
                <span className="mealTodayStatLabel">fat</span>
              </div>
            </div>
            <div className="mealTodayEntries">
              {todayLog.map((entry) => (
                <div className="mealTodayEntry" key={entry.id}>
                  <span className="mealTodayEntryName">{entry.name}</span>
                  <span className="mealTodayEntryCal">{entry.calories} cal</span>
                  <button
                    className="mealRemoveBtn"
                    onClick={() => removeLog(entry.id)}
                    type="button"
                    aria-label="Remove"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {showForm && (
          <div className="mealForm">
            <div className="mealFormTitle">{editingId ? "Edit Meal" : "Add New Meal"}</div>
            <div className="mealFormRow">
              <div style={{ flex: 1 }}>
                <input
                  className={`mealFormInput mealFormInputWide ${formErrors.name ? "inputError" : ""}`}
                  type="text"
                  placeholder="Meal name *"
                  value={form.name}
                  onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setFormErrors(p => ({ ...p, name: undefined })); }}
                />
                {formErrors.name && <div className="fieldError">{formErrors.name}</div>}
              </div>
              <select
                className="mealFormSelect"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div className="mealFormRow">
              <input
                className="mealFormInput"
                type="number"
                placeholder="Calories"
                value={form.calories}
                onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))}
              />
              <input
                className="mealFormInput"
                type="number"
                placeholder="Protein (g)"
                value={form.protein}
                onChange={(e) => setForm((f) => ({ ...f, protein: e.target.value }))}
              />
              <input
                className="mealFormInput"
                type="number"
                placeholder="Carbs (g)"
                value={form.carbs}
                onChange={(e) => setForm((f) => ({ ...f, carbs: e.target.value }))}
              />
              <input
                className="mealFormInput"
                type="number"
                placeholder="Fat (g)"
                value={form.fat}
                onChange={(e) => setForm((f) => ({ ...f, fat: e.target.value }))}
              />
            </div>
            <div className="mealFormRow">
              <textarea
                className="mealFormTextarea"
                placeholder="Ingredients (comma separated)"
                value={form.ingredients}
                onChange={(e) => setForm((f) => ({ ...f, ingredients: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="mealFormRow">
              <textarea
                className="mealFormTextarea"
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="mealFormActions">
              <button className="btn btnPrimary" onClick={handleSave} type="button">
                {editingId ? "Update Meal" : "Save Meal"}
              </button>
              <button className="btn" onClick={closeForm} type="button">Cancel</button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mealFilters">
          <input
            className="mealSearchInput"
            type="text"
            placeholder="Search meals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="mealCategoryFilters">
            <button
              className={`mealFilterBtn ${filterCategory === "all" ? "mealFilterBtnActive" : ""}`}
              onClick={() => setFilterCategory("all")}
              type="button"
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`mealFilterBtn ${filterCategory === c ? "mealFilterBtnActive" : ""}`}
                onClick={() => setFilterCategory(c)}
                type="button"
              >
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        {/* Meal Grid */}
        <div className="mealGrid">
          {filteredMeals.length === 0 && (
            <div className="mealEmpty">
              {meals.length === 0
                ? "No meals saved yet. Add one to get started."
                : "No meals match your search."}
            </div>
          )}
          {filteredMeals.map((meal) => (
            <div className="mealCard" key={meal.id}>
              <div className="mealCardHeader">
                <div className="mealCardName">{meal.name}</div>
                <div className="mealCardCategory">{CATEGORY_LABELS[meal.category] || meal.category}</div>
              </div>
              <div className="mealCardMacros">
                <div className="mealMacro">
                  <span className="mealMacroValue">{meal.calories || "—"}</span>
                  <span className="mealMacroLabel">cal</span>
                </div>
                <div className="mealMacro">
                  <span className="mealMacroValue">{meal.protein || "—"}</span>
                  <span className="mealMacroLabel">protein</span>
                </div>
                <div className="mealMacro">
                  <span className="mealMacroValue">{meal.carbs || "—"}</span>
                  <span className="mealMacroLabel">carbs</span>
                </div>
                <div className="mealMacro">
                  <span className="mealMacroValue">{meal.fat || "—"}</span>
                  <span className="mealMacroLabel">fat</span>
                </div>
              </div>
              {meal.ingredients && (
                <div className="mealCardIngredients">
                  <span className="mealCardIngrLabel">Ingredients:</span> {meal.ingredients}
                </div>
              )}
              {meal.notes && (
                <div className="mealCardNotes">{meal.notes}</div>
              )}
              <div className="mealCardActions">
                <button className="btn mealCardBtn" onClick={() => quickLog(meal)} type="button">
                  + Log Today
                </button>
                <button className="btn mealCardBtn" onClick={() => openEditForm(meal)} type="button">
                  Edit
                </button>
                <button className="mealDeleteBtn" onClick={() => setConfirmDeleteId(meal.id)} type="button">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Delete Meal"
        message={`Delete "${meals.find(m => m.id === confirmDeleteId)?.name || "this meal"}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => handleDelete(confirmDeleteId)}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
}
