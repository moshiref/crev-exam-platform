import { useEffect, useState } from 'react'
import {
  HiOutlinePhoto,
  HiOutlineCheckCircle,
  HiOutlineArrowPath,
  HiOutlineGlobeAlt,
  HiOutlineDevicePhoneMobile,
  HiOutlineEnvelope,
  HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2'
import DashboardCard from '../../components/ui/DashboardCard.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import TextArea from '../../components/ui/TextArea.jsx'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { logoutAdmin } from '../../services/auth.js'

const SETTINGS_KEY = 'crev-platform-settings'

const PRIMARY_COLOR_OPTIONS = [
  { value: '#2563EB', label: 'أزرق (الافتراضي)' },
  { value: '#22C55E', label: 'أخضر' },
  { value: '#7C3AED', label: 'بنفسجي' },
  { value: '#F59E0B', label: 'برتقالي' },
  { value: '#0EA5E9', label: 'سماوي' },
  { value: '#EF4444', label: 'أحمر' },
]

const DEFAULT_SETTINGS = {
  centerName: 'منصة التميز',
  tagline: '',
  primaryColor: '#2563EB',
  showSplash: true,
  splashText: 'مرحباً بك في منصتنا التعليمية',
  contactEmail: '',
  contactPhone: '',
  whatsapp: '',
  favicon: '',
  logo: '',
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * White-labeling / platform settings. Every change is persisted to
 * localStorage and applied immediately (primary color, document title,
 * favicon) so administrators can rebrand the platform to their center.
 */
export default function Settings() {
  const [settings, setSettings] = useState(loadSettings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    applySettings(settings)
  }, [settings])

  function applySettings(s) {
    const root = document.documentElement
    root.style.setProperty('--color-primary', s.primaryColor)
    root.style.setProperty('--color-secondary', s.primaryColor || DEFAULT_SETTINGS.primaryColor)
    if (s.centerName) document.title = s.centerName
    if (s.favicon) {
      let link = document.querySelector("link[rel='icon']")
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = s.favicon
    }
  }

  function update(patch) {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  function handleUpload(key) {
    return async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      const dataUrl = await readFileAsDataURL(file)
      update({ [key]: dataUrl })
    }
  }

  function handleSave(e) {
    e.preventDefault()
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  function handleReset() {
    setSettings(DEFAULT_SETTINGS)
    localStorage.removeItem(SETTINGS_KEY)
    applySettings(DEFAULT_SETTINGS)
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">إعدادات المنصة</h2>
          <p className="mt-1 text-sm text-slate-500">هوية المركز والتواصل وشاشة الترحيب</p>
        </div>
        {saved && (
          <Badge tone="success" className="gap-1.5">
            <HiOutlineCheckCircle className="h-4 w-4" /> تم الحفظ
          </Badge>
        )}
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        <DashboardCard title="هوية المركز (White Label)">
          <div className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-2xl text-slate-300">
                {settings.logo ? (
                  <img src={settings.logo} alt="الشعار" className="h-full w-full object-contain" />
                ) : (
                  <HiOutlinePhoto />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">شعار المركز</p>
                <label className="mt-2 inline-flex cursor-pointer">
                  <span className="rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-primary ring-1 ring-blue-100 transition-colors hover:bg-blue-100">
                    رفع شعار جديد
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleUpload('logo')} />
                </label>
                <p className="mt-1.5 max-w-[220px] text-[11px] text-slate-400">يُعرض في الصفحة الرئيسية والتطبيق</p>
              </div>
            </div>

            <Input
              id="centerName"
              label="اسم المركز / المنصة"
              value={settings.centerName}
              onChange={(e) => update({ centerName: e.target.value })}
            />

            <Input
              id="tagline"
              label="الشعار التعريفي (سطر قصير)"
              placeholder="مثال: تعليم متميز لمستقبل أفضل"
              value={settings.tagline}
              onChange={(e) => update({ tagline: e.target.value })}
            />

            <Select
              id="primaryColor"
              label="اللون الأساسي"
              options={PRIMARY_COLOR_OPTIONS}
              value={settings.primaryColor}
              onChange={(e) => update({ primaryColor: e.target.value })}
            />

            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 ring-1 ring-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-700">معاينة الهوية</p>
                <p className="text-xs text-slate-400">يظهر اللون والشعار على الفور</p>
              </div>
              <div className="flex items-center gap-2.5">
                {settings.logo ? (
                  <img src={settings.logo} alt="" className="h-8 w-8 rounded-lg object-contain" />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-sm text-white">
                    <HiOutlineGlobeAlt />
                  </span>
                )}
                <span className="font-display text-sm font-extrabold text-slate-800">{settings.centerName}</span>
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="شاشة الترحيب (Splash)">
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-700">إظهار شاشة الترحيب عند فتح المنصة</p>
                <p className="text-xs text-slate-400">نقرة واحدة لتمييز تجربة الدخول</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.showSplash}
                onClick={() => update({ showSplash: !settings.showSplash })}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${settings.showSplash ? 'bg-primary' : 'bg-slate-200'}`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${settings.showSplash ? 'right-6' : 'right-1'}`}
                />
              </button>
            </div>
            {settings.showSplash && (
              <TextArea
                id="splashText"
                label="نص الترحيب"
                rows={3}
                value={settings.splashText}
                onChange={(e) => update({ splashText: e.target.value })}
              />
            )}
          </div>
        </DashboardCard>

        <DashboardCard title="بيانات التواصل">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <HiOutlineDevicePhoneMobile className="mt-2.5 h-5 w-5 shrink-0 text-slate-400" />
              <Input
                id="contactPhone"
                label="رقم الهاتف"
                dir="ltr"
                value={settings.contactPhone}
                onChange={(e) => update({ contactPhone: e.target.value })}
              />
            </div>
            <div className="flex items-start gap-2">
              <HiOutlineDevicePhoneMobile className="mt-2.5 h-5 w-5 shrink-0 text-emerald-500" />
              <Input
                id="whatsapp"
                label="رقم واتساب"
                dir="ltr"
                value={settings.whatsapp}
                onChange={(e) => update({ whatsapp: e.target.value })}
              />
            </div>
            <div className="flex items-start gap-2 sm:col-span-2">
              <HiOutlineEnvelope className="mt-2.5 h-5 w-5 shrink-0 text-slate-400" />
              <Input
                id="contactEmail"
                label="البريد الإلكتروني"
                type="email"
                dir="ltr"
                value={settings.contactEmail}
                onChange={(e) => update({ contactEmail: e.target.value })}
              />
            </div>
            <div className="flex items-start gap-2 sm:col-span-2">
              <HiOutlinePhoto className="mt-2.5 h-5 w-5 shrink-0 text-slate-400" />
              <div className="flex-1">
                <p className="mb-1.5 text-sm font-bold text-slate-600">أيقونة الموقع (Favicon)</p>
                <div className="flex items-center gap-3">
                  {settings.favicon ? (
                    <img src={settings.favicon} alt="" className="h-9 w-9 rounded-lg ring-1 ring-slate-200" />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-primary"><HiOutlinePhoto /></span>
                  )}
                  <label className="cursor-pointer">
                    <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-slate-200">
                      رفع الأيقونة
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload('favicon')} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </DashboardCard>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="md">
            حفظ التغييرات
          </Button>
          <Button type="button" variant="outline" size="md" icon={<HiOutlineArrowPath />} onClick={handleReset}>
            استعادة الافتراضي
          </Button>
        </div>
      </form>

      <DashboardCard title="الجلسة">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">تسجيل الخروج من لوحة تحكم الإدارة</p>
          <Button
            variant="danger"
            icon={<HiOutlineArrowRightOnRectangle />}
            onClick={() => {
              logoutAdmin()
              window.location.href = '/'
            }}
          >
            تسجيل الخروج
          </Button>
        </div>
      </DashboardCard>
    </div>
  )
}