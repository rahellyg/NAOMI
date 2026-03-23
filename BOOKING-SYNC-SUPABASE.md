# סנכרון פגישות לכל דפדפן (Supabase)

בלי זה, הזמנות נשמרות רק ב־`localStorage` של הדפדפן של **הלקוחה** – לא תראי אותן בכרום אחר.

## שלבים (פעם אחת)

1. צרי חשבון ב־[supabase.com](https://supabase.com) → **New project**.
2. ב־**SQL Editor** הריצי:

```sql
create table naomi_bookings (
  id text primary key,
  created_at timestamptz default now(),
  date_str text not null,
  time_str text not null,
  duration_minutes int,
  full_name text,
  phone text,
  email text,
  birth_date text
);

alter table naomi_bookings enable row level security;

create policy "anon_insert_naomi_bookings"
  on naomi_bookings for insert to anon with check (true);

create policy "anon_select_naomi_bookings"
  on naomi_bookings for select to anon using (true);
```

3. **Settings → API**: העתיקי  
   - **Project URL**  
   - **anon public** key  

4. ב־`index.html` וב־`schedule-admin.html` מלאי (או הגדירי לפני הסקריפט):

```html
<script>
  window.NAOMI_SUPABASE_URL = 'https://xxxx.supabase.co';
  window.NAOMI_SUPABASE_ANON_KEY = 'eyJhbG...';
</script>
```

או ערכי ברירת המחדל בתוך הקבצים: `SUPABASE_URL` ו־`SUPABASE_ANON_KEY`.

5. פרסמי את העדכון ל־GitHub. אחרי **אישור** בדף ההזמנה – השורה תיכנס ל־Supabase. בדף הניהול לחצי **רענון מהקובץ ב-GitHub** – הרשימה תימזג גם מ־Supabase.

## אבטחה

ה־**anon** key חשוף בדף הציבורי – כל אחד יכול theoretically לקרוא/להוסיף לטבלה אם יודע את כתובת הפרויקט. לפרויקט קטן זה מקובל; לשיפור אפשר מאוחר יותר להעביר ל־Edge Function עם מפתח סודי.

## GitHub JSON

`naomi-bookings.json` נשאר אופציונלי (גיבוי / ייצוא). Supabase הוא מקור החי לרשימה בזמן אמת בין דפדפנים.
