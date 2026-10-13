# Employee Management System - Renderer

This is the React frontend for the Employee Management System, built with Vite, React, TypeScript, and Tailwind CSS with RTL support.

## Component Mapping (Figma → Code)

### Layout Components
- **Figma Header** → `src/components/layout/TopBar.tsx`
- **Figma Sidebar** → `src/components/layout/RightSidebar.tsx` (RTL positioned)
- **Page Shell** → `src/components/layout/PageShell.tsx` (Main layout wrapper)

### Page Components
- **Dashboard** → `src/components/pages/Dashboard.tsx`
- **الموظفون (Employees)** → `src/components/pages/EmployeesPage.tsx`
- **الدورات (Courses)** → `src/components/pages/CoursesPage.tsx`
- **التقييمات (Evaluations)** → `src/components/pages/EvaluationsPage.tsx`
- **الترقيات (Promotions)** → `src/components/pages/PromotionsPage.tsx`
- **المكافآت (Rewards)** → `src/components/pages/RewardsPage.tsx`
- **الإجازات (Leave)** → `src/components/pages/LeavePage.tsx`
- **الغياب (Absence)** → `src/components/pages/AbsencePage.tsx`
- **الرواتب (Salaries)** → `src/components/pages/SalariesPage.tsx`
- **سنوات الخدمة (Service Years)** → `src/components/pages/ServiceYearsPage.tsx`
- **أسعار الصرف (Exchange Rates)** → `src/components/pages/ExchangeRatesPage.tsx`
- **التقارير (Reports)** → `src/components/pages/ReportsPage.tsx`
- **Employee Profile** → `src/components/pages/EmployeeProfile.tsx`

### UI Components
- **Button** → `src/components/ui/Button.tsx`
- **Avatar** → `src/components/ui/Avatar.tsx`
- **DropdownMenu** → `src/components/ui/DropdownMenu.tsx`
- **CurrencyToggle** → `src/components/CurrencyToggle.tsx`

### Styles
- **Main Styles** → `src/styles/index.css` (Tailwind + RTL utilities)
- **Design Tokens** → `src/styles/tokens.css` (Colors, spacing, typography from Figma)

## RTL Support

The application is built RTL-first with:
- `dir="rtl"` on the HTML element
- Tailwind CSS RTL utilities (`space-x-reverse`, etc.)
- Arabic font support
- Right-aligned sidebar
- Proper text alignment for Arabic content

## Key Features

1. **React Router** - Client-side routing for all pages
2. **Tailwind CSS** - Utility-first styling with custom design tokens
3. **RTL Layout** - Right-to-left layout optimized for Arabic
4. **Component Architecture** - Clean separation of layout, pages, and UI components
5. **TypeScript** - Full type safety throughout the application

## How to Extend

### Adding a New Page
1. Create the page component in `src/components/pages/`
2. Add the route to `src/App.tsx`
3. Add the menu item to `src/components/layout/RightSidebar.tsx`

### Adding UI Components
1. Create the component in `src/components/ui/`
2. Follow the existing patterns for styling and TypeScript types
3. Use Radix UI primitives for complex components

### Styling Guidelines
- Use Tailwind classes for styling
- Reference design tokens in `src/styles/tokens.css`
- Ensure RTL compatibility with `space-x-reverse` and proper text alignment
- Maintain 56px row height for tables (--table-row-height)

## Development

```bash
# Start the development server
cd src/renderer
npm run dev

# Build for production
npm run build
```

The development server will start on `http://localhost:5173` with hot reload enabled.
