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

4. ב־`index.html` ובדפי הניהול הרלוונטיים (`schedule-admin-bookings.html`, `schedule-admin-questions.html` וכו’) מלאי (או הגדירי לפני הסקריפט):

```html
<script>
  window.NAOMI_SUPABASE_URL = 'https://xxxx.supabase.co';
  window.NAOMI_SUPABASE_ANON_KEY = 'eyJhbG...';
</script>
```

או ערכי ברירת המחדל בתוך הקבצים: `SUPABASE_URL` ו־`SUPABASE_ANON_KEY`.

5. פרסמי את העדכון ל־GitHub. אחרי **אישור** בדף ההזמנה – השורה תיכנס ל־Supabase. בדף הניהול לחצי **רענון מהקובץ ב-GitHub** – הרשימה תימזג גם מ־Supabase.

---

## טבלת שאלות – `naomi_questions` (לראות שאלות מכל דפדפן)

בלי טבלה זו, שאלות מהטופס „שאלה ממוקדת” נשמרות בעיקר ב־`localStorage` של **הדפדפן של השולחת** – לא תראי אותן בכרום אחר או בנייד.

**אחרי** יצירת הטבלה והמדיניות, כל שליחה מוצלחת מ־`index.html` קוראת ל־`syncQuestionToSupabase` ומוסיפה שורה לענן. ב־**`schedule-admin-questions.html`** לחצי **רענון** – הרשימה תימזג מ־Supabase (בנוסף ל־GitHub JSON ול־localStorage).

### SQL (ב־SQL Editor, אחרי `naomi_bookings` או בנפרד)

```sql
create table naomi_questions (
  id text primary key,
  created_at timestamptz default now(),
  full_name text,
  birth_date text,
  phone text,
  email text,
  question_text text
);

alter table naomi_questions enable row level security;

create policy "anon_insert_naomi_questions"
  on naomi_questions for insert to anon with check (true);

create policy "anon_select_naomi_questions"
  on naomi_questions for select to anon using (true);
```

אותו **Project URL** ו־**anon public key** כמו לפגישות – אין צורך במפתח נפרד. ודאי ש־`window.NAOMI_SUPABASE_URL` ו־`window.NAOMI_SUPABASE_ANON_KEY` מוגדרים ב־`index.html` **וב־`schedule-admin-questions.html`** (כבר קיימים אם העתקת מהדוגמה של הפגישות).

### סיכום – מה לעשות כדי לראות שאלות מכל מקום

1. הריצי את ה־SQL למעלה בפרויקט Supabase שלך.  
2. ודאי שהמפתחות ב־`index.html` וב־`schedule-admin-questions.html` תואמים לפרויקט.  
3. פרסמי ל־GitHub / רענני את האתר.  
4. שלחי שאלה מדף הנחיתה (מכל דפדפן) – אחרי אישור בטופס אמורה להופיע שורה ב־**Table Editor → naomi_questions**.  
5. בניהול שאלות – **רענון**.

## אבטחה

ה־**anon** key חשוף בדף הציבורי – כל אחד יכול theoretically לקרוא/להוסיף לטבלה אם יודע את כתובת הפרויקט. לפרויקט קטן זה מקובל; לשיפור אפשר מאוחר יותר להעביר ל־Edge Function עם מפתח סודי.

## GitHub JSON

`naomi-bookings.json` נשאר אופציונלי (גיבוי / ייצוא). Supabase הוא מקור החי לרשימה בזמן אמת בין דפדפנים.
