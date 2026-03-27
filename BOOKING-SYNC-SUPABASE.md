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

-- מניעת double booking בשרת: אין שתי פגישות עם חפיפת זמן באותו יום
-- (לפי time_str + duration_minutes, ברירת מחדל 45 כמו בדף הנחיתה)
create or replace function public.naomi_bookings_time_to_minutes(t text)
returns integer
language sql
immutable
as $$
  select (split_part(btrim(t), ':', 1)::int * 60)
       + split_part(btrim(t), ':', 2)::int;
$$;

create or replace function public.naomi_bookings_check_no_overlap()
returns trigger
language plpgsql
as $f$
declare
  r record;
  ns int;
  ne int;
  nd int;
  os int;
  oe int;
  od int;
begin
  nd := coalesce(new.duration_minutes, 45);
  ns := public.naomi_bookings_time_to_minutes(new.time_str);
  ne := ns + nd;

  for r in
    select id, time_str, duration_minutes
    from public.naomi_bookings
    where date_str = new.date_str
      and (tg_op = 'INSERT' or id is distinct from new.id)
  loop
    od := coalesce(r.duration_minutes, 45);
    os := public.naomi_bookings_time_to_minutes(r.time_str);
    oe := os + od;
    if ns < oe and ne > os then
      raise exception 'naomi_bookings_interval_overlap'
        using errcode = '23505',
              detail = 'booking overlaps existing row on this date';
    end if;
  end loop;

  return new;
end;
$f$;

drop trigger if exists naomi_bookings_overlap_guard on public.naomi_bookings;
create trigger naomi_bookings_overlap_guard
  before insert or update of date_str, time_str, duration_minutes
  on public.naomi_bookings
  for each row
  execute function public.naomi_bookings_check_no_overlap();
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

### כבר יצרת את `naomi_bookings` בלי הטריגר?

הריצי ב־**SQL Editor** רק את הבלוק של הפונקציות והטריגר מתוך הסעיף למעלה (מ־`create or replace function public.naomi_bookings_time_to_minutes` ועד סוף `create trigger ...`). אם כבר יש בטבלה שורות **חופפות** באותו יום, מחיקה או תיקון ידני לפני ההרצה – אחרת הטריגר יישאר תקף רק לשורות חדשות.

### התנהגות בדף הנחיתה

כש־Supabase מוגדר, אחרי לחיצה על אישור ההזמנה נשלח קודם **POST** לטבלה. רק אם השרת מאשר – נשמרים `localStorage`, webhook והצגת ההודעה. חפיפה או כפילות מחזירות **409** – המשתמשת רואה הודעה בעברית והממשק מתרענן. בלי מפתחות Supabase ההתנהגות נשארת מקומית כמו קודם.

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
