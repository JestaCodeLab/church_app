# Loader Component - Quick Reference

## 🚀 Quick Start

```tsx
import Loader from '../../../components/ui/Loader';

// Use in your loading state:
{loading && <Loader variant="skeleton-table" count={10} />}
```

---

## 🎨 Choose Your Variant

### 1️⃣ Dashboard Pages
**Use:** `skeleton-dashboard`
```tsx
{loading && <Loader variant="skeleton-dashboard" />}
```
**Pages:** Dashboard, FinanceOverview, AdminDashboard
**Shows:** 4 stat cards + content section

---

### 2️⃣ Data Tables
**Use:** `skeleton-table`
```tsx
{loading && <Loader variant="skeleton-table" count={10} />}
```
**Pages:** AllMembers, AllEvents, AllTransactions
**Shows:** Multiple rows with columns

---

### 3️⃣ Card Grids
**Use:** `skeleton-cards`
```tsx
{loading && <Loader variant="skeleton-cards" count={6} />}
```
**Pages:** Preachers, Templates, EventDetails
**Shows:** Grid of card items

---

### 4️⃣ Simple Lists
**Use:** `skeleton-list`
```tsx
{loading && <Loader variant="skeleton-list" count={5} />}
```
**Pages:** ActivityLogs, SMSHistory, AdminLogs
**Shows:** Column of list items

---

### 5️⃣ Full Page Load
**Use:** `full-page`
```tsx
{loading && <Loader variant="full-page" message="Loading..." />}
```
**Pages:** Initial page load, critical blocking
**Shows:** Centered spinner overlay

---

### 6️⃣ Inline Buttons
**Use:** `inline`
```tsx
<button disabled={saving}>
  {saving && <Loader variant="inline" size="sm" />}
  Save
</button>
```
**Use:** Action buttons, inline operations
**Shows:** Spinner + optional text

---

## 📊 Variant Comparison Table

| Variant | Best For | Shows | Count | Size |
|---------|----------|-------|-------|------|
| `skeleton-dashboard` | Dashboard layouts | 4 stats + content | N/A | Auto |
| `skeleton-table` | Data tables | Multiple rows | ✅ | Auto |
| `skeleton-cards` | Card grids | Card items | ✅ | Auto |
| `skeleton-list` | Simple lists | List items | ✅ | Auto |
| `full-page` | Full page load | Centered spinner | N/A | sm/md/lg |
| `spinner` | Content area | Spinner + message | N/A | sm/md/lg |
| `inline` | Buttons/inline | Spinner + text | N/A | sm/md/lg |

---

## 🎛️ Props

```tsx
<Loader
  variant="skeleton-table"    // Required
  count={10}                   // Number of items (optional, default: 3)
  size="md"                    // sm | md | lg (optional)
  message="Loading..."         // Text message (optional)
  className="gap-4"            // Custom CSS (optional)
/>
```

### Size Reference
- `sm` - 6x6 (buttons, inline)
- `md` - 8x8 (default)
- `lg` - 12x12 (full page)

---

## 💡 Common Patterns

### Pattern: Table with Loading
```tsx
{loading ? (
  <Loader variant="skeleton-table" count={10} />
) : items.length === 0 ? (
  <EmptyState />
) : (
  <Table items={items} />
)}
```

### Pattern: Cards with Loading
```tsx
{loading ? (
  <Loader variant="skeleton-cards" count={6} />
) : items.length === 0 ? (
  <EmptyState />
) : (
  <CardGrid items={items} />
)}
```

### Pattern: Full Page Load
```tsx
if (loading) {
  return (
    <div className="min-h-screen">
      <Loader variant="skeleton-dashboard" />
    </div>
  );
}
return <YourContent />;
```

### Pattern: Button with Loading
```tsx
<button disabled={saving} className="flex items-center gap-2">
  {saving && <Loader variant="inline" size="sm" />}
  <span>{saving ? 'Saving…' : 'Save'}</span>
</button>
```

---

## ✅ What to Remove

When updating a page, remove these old patterns:

```tsx
// ❌ Old Pattern 1: Manual spinner
<div className="flex justify-center">
  <Loader2 className="w-8 h-8 animate-spin" />
</div>

// ❌ Old Pattern 2: Custom CSS spinner
<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>

// ❌ Old Pattern 3: Inconsistent styling
{loading && <Loader2 className="animate-spin" />}
```

Replace all with:
```tsx
// ✅ New Pattern: Consistent loader
{loading && <Loader variant="skeleton-table" count={10} />}
```

---

## 🎯 Decision Tree

```
Is it a dashboard with stats cards?
  → Yes? Use skeleton-dashboard
  → No? Continue...

Does it show a data table?
  → Yes? Use skeleton-table
  → No? Continue...

Is it a grid of cards?
  → Yes? Use skeleton-cards
  → No? Continue...

Is it a simple list?
  → Yes? Use skeleton-list
  → No? Continue...

Is it a button or inline?
  → Yes? Use inline
  → No? Use full-page (fallback)
```

---

## 🌙 Dark Mode

**No additional setup needed!**

All variants automatically support dark mode:
- Light theme: Gray backgrounds
- Dark theme: Darker gray backgrounds
- Works with Tailwind's `dark:` mode

---

## 📁 File Locations

| File | Purpose |
|------|---------|
| `/components/ui/Loader.tsx` | Main component |
| `/components/ui/LOADER_GUIDE.md` | Detailed documentation |
| `/LOADER_IMPLEMENTATION_STATUS.md` | Update status |
| `/LOADER_QUICK_REFERENCE.md` | This file |

---

## 🔗 Import Path

Choose based on your location:

```tsx
// From components/
import Loader from '../ui/Loader';

// From pages/merchant/
import Loader from '../../../components/ui/Loader';

// From pages/admin/
import Loader from '../../../components/ui/Loader';

// From pages/auth/
import Loader from '../../../components/ui/Loader';
```

---

## ⚡ Performance Tips

1. **Match your count** - Set `count` to match actual items
2. **Use appropriate variant** - Don't use dashboard skeleton for a list
3. **Remove unused imports** - Clean up old Loader2 imports
4. **Test responsiveness** - Verify on mobile/tablet

---

## 🐛 Troubleshooting

### Skeleton doesn't match my layout?
→ Choose different variant or create custom variant

### Too few/many skeleton items?
→ Adjust `count` prop: `count={8}`

### Looks weird in dark mode?
→ Check parent has `dark:` class or prefers-color-scheme

### Animation looks janky?
→ Ensure parent container has defined height

---

## 📝 Update Checklist

When updating a page:
- [ ] Import custom Loader
- [ ] Remove old Loader2 import
- [ ] Replace loading state rendering
- [ ] Choose correct variant
- [ ] Set count prop if needed
- [ ] Test loading state
- [ ] Test dark mode
- [ ] Test responsiveness

---

## 🚀 Next Steps

1. Pick a page from the update list
2. Use the Quick Start pattern above
3. Choose variant from the decision tree
4. Test and verify
5. Move to next page

Need details? See `/LOADER_IMPLEMENTATION_STATUS.md`
