export const SUPPORTED_LOCALES = ["en", "pt"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  pt: "Português (Portugal)",
};

type Dict = Record<string, string>;

const en: Dict = {
  // Language switcher
  "language.label": "Language",
  "language.english": "English",
  "language.portuguese": "Português (Portugal)",

  // Sidebar navigation
  "nav.dashboard": "Dashboard",
  "nav.timeline": "Timeline",
  "nav.guests": "Guests & RSVP",
  "nav.seating": "Seating",
  "nav.suppliers": "Suppliers",
  "nav.budget": "Budget",
  "nav.forms": "Forms",
  "nav.settings": "Settings",

  // Top bar
  "topbar.account": "Account",
  "topbar.signOut": "Sign out",

  // Guest top bar
  "guestTopBar.yourWedding": "Your wedding",
  "guestTopBar.saveToCloud": "Save to cloud",
  "guestTopBar.logIn": "Log In",
  "guestTopBar.bannerPrefix": "Your planning is saved on this device only.",
  "guestTopBar.bannerSuffix": "to access from anywhere.",
  "guestTopBar.dismiss": "Dismiss banner",
  "guestTopBar.completeDetails": "Complete your wedding details",
  "guestTopBar.saveLabel": "save your wedding",

  // Landing page
  "landing.workspace": "Workspace",
  "landing.logIn": "Log In",
  "landing.startPlanning": "Start Planning",
  "landing.readyTitle": "Ready to start?",
  "landing.readyDesc": "No credit card. No commitment. Save to the cloud whenever you're ready.",
  "landing.continueWorkspace": "Continue to your workspace",
  "landing.startCta": "Start Planning My Wedding",
  "landing.signUp": "Sign Up",

  // Hero
  "hero.titleLine1": "Your whole wedding,",
  "hero.titleLine2": "planned in one place.",
  "hero.subtitle":
    "Build your timeline, manage your guest list, track your budget, and collect RSVPs — without paying a planner. Free to start, no credit card, no commitment.",
  "hero.continueWorkspace": "Continue to your workspace",
  "hero.startPlanning": "Start Planning My Wedding",
  "hero.logIn": "Log In",
  "hero.signedIn": "You're signed in.",
  "hero.noAccount":
    "No account needed to start. Save your work to the cloud whenever you're ready.",

  // Value props
  "value.title": "Everything you need, nothing you don't.",
  "value.subtitle": "Built for couples who want one place to keep it all.",
  "value.timeline.title": "Smart timeline",
  "value.timeline.desc":
    "Auto-generated checklist based on your wedding date, with priorities you can drag and drop.",
  "value.guests.title": "Guest list & RSVP",
  "value.guests.desc":
    "Track invitations, dietary needs, plus-ones, and meal choices — all in one searchable table.",
  "value.budget.title": "Budget tracker",
  "value.budget.desc":
    "Planned vs. actual spend at a glance, with category breakdowns and over-budget alerts.",
  "value.suppliers.title": "Suppliers & quotes",
  "value.suppliers.desc":
    "Compare vendors side-by-side. Move them through your pipeline from researching to booked.",
  "value.forms.title": "Custom RSVP forms",
  "value.forms.desc": "Build a public RSVP form with your own questions. Share with one link.",
  "value.together.title": "Plan together",
  "value.together.desc": "Invite your partner and your planner. Everyone stays in sync.",

  // Testimonials
  "testimonials.title": "Couples love planning here.",
  "testimonials.subtitle": "Real feedback from couples who've used VowPlan.",

  // Auth pages
  "auth.signIn": "Sign in",
  "auth.welcomeBack": "Welcome back to VowPlan",
  "auth.forgotPassword": "Forgot password?",
  "auth.noAccount": "Don't have an account?",
  "auth.signUpLink": "Sign up",
  "auth.createAccount": "Create an account",
  "auth.startPerfectWedding": "Start planning your perfect wedding",
  "auth.alreadyHaveAccount": "Already have an account?",
  "auth.signInLink": "Sign in",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.fullName": "Full Name",
  "auth.confirmPassword": "Confirm Password",
  "auth.signingIn": "Signing in...",
  "auth.creatingAccount": "Creating account...",
  "auth.passwordsDontMatch":
    "Passwords do not match. Please re-enter the same password in both fields.",
};

const pt: Dict = {
  // Language switcher
  "language.label": "Idioma",
  "language.english": "English",
  "language.portuguese": "Português (Portugal)",

  // Sidebar navigation
  "nav.dashboard": "Painel",
  "nav.timeline": "Cronograma",
  "nav.guests": "Convidados e RSVP",
  "nav.seating": "Disposição",
  "nav.suppliers": "Fornecedores",
  "nav.budget": "Orçamento",
  "nav.forms": "Formulários",
  "nav.settings": "Definições",

  // Top bar
  "topbar.account": "Conta",
  "topbar.signOut": "Terminar sessão",

  // Guest top bar
  "guestTopBar.yourWedding": "O seu casamento",
  "guestTopBar.saveToCloud": "Guardar na nuvem",
  "guestTopBar.logIn": "Iniciar sessão",
  "guestTopBar.bannerPrefix": "O seu planeamento está guardado apenas neste dispositivo.",
  "guestTopBar.bannerSuffix": "para aceder a partir de qualquer lugar.",
  "guestTopBar.dismiss": "Dispensar aviso",
  "guestTopBar.completeDetails": "Complete os dados do seu casamento",
  "guestTopBar.saveLabel": "guardar o seu casamento",

  // Landing page
  "landing.workspace": "Área de trabalho",
  "landing.logIn": "Iniciar sessão",
  "landing.startPlanning": "Começar a planear",
  "landing.readyTitle": "Pronto para começar?",
  "landing.readyDesc":
    "Sem cartão de crédito. Sem compromisso. Guarde na nuvem quando estiver pronto.",
  "landing.continueWorkspace": "Continuar para a sua área de trabalho",
  "landing.startCta": "Começar a planear o meu casamento",
  "landing.signUp": "Criar conta",

  // Hero
  "hero.titleLine1": "Todo o seu casamento,",
  "hero.titleLine2": "planeado num só sítio.",
  "hero.subtitle":
    "Crie o seu cronograma, faça a gestão da lista de convidados, controle o orçamento e recolha RSVPs — sem pagar a um wedding planner. Comece gratuitamente, sem cartão de crédito e sem compromisso.",
  "hero.continueWorkspace": "Continuar para a sua área de trabalho",
  "hero.startPlanning": "Começar a planear o meu casamento",
  "hero.logIn": "Iniciar sessão",
  "hero.signedIn": "A sessão está iniciada.",
  "hero.noAccount":
    "Não é necessária conta para começar. Guarde o seu trabalho na nuvem quando quiser.",

  // Value props
  "value.title": "Tudo o que precisa, nada do que não precisa.",
  "value.subtitle": "Feito para casais que querem tudo num só lugar.",
  "value.timeline.title": "Cronograma inteligente",
  "value.timeline.desc":
    "Lista de tarefas gerada automaticamente com base na data do casamento, com prioridades que pode arrastar e largar.",
  "value.guests.title": "Lista de convidados e RSVP",
  "value.guests.desc":
    "Acompanhe convites, restrições alimentares, acompanhantes e escolhas de ementa — tudo numa tabela pesquisável.",
  "value.budget.title": "Controlo de orçamento",
  "value.budget.desc":
    "Comparação entre orçamento planeado e gasto real, com categorias e alertas quando ultrapassa o limite.",
  "value.suppliers.title": "Fornecedores e orçamentos",
  "value.suppliers.desc":
    "Compare fornecedores lado a lado. Faça-os avançar desde a pesquisa até à reserva.",
  "value.forms.title": "Formulários de RSVP personalizados",
  "value.forms.desc":
    "Crie um formulário de RSVP público com as suas próprias perguntas. Partilhe com um único link.",
  "value.together.title": "Planeiem em conjunto",
  "value.together.desc":
    "Convide o seu parceiro e o seu wedding planner. Todos ficam sincronizados.",

  // Testimonials
  "testimonials.title": "Os casais adoram planear aqui.",
  "testimonials.subtitle": "Feedback real de casais que já usaram o VowPlan.",

  // Auth pages
  "auth.signIn": "Iniciar sessão",
  "auth.welcomeBack": "Bem-vindo de volta ao VowPlan",
  "auth.forgotPassword": "Esqueceu-se da palavra-passe?",
  "auth.noAccount": "Ainda não tem conta?",
  "auth.signUpLink": "Criar conta",
  "auth.createAccount": "Criar conta",
  "auth.startPerfectWedding": "Comece a planear o seu casamento perfeito",
  "auth.alreadyHaveAccount": "Já tem conta?",
  "auth.signInLink": "Iniciar sessão",
  "auth.email": "E-mail",
  "auth.password": "Palavra-passe",
  "auth.fullName": "Nome completo",
  "auth.confirmPassword": "Confirmar palavra-passe",
  "auth.signingIn": "A iniciar sessão...",
  "auth.creatingAccount": "A criar conta...",
  "auth.passwordsDontMatch":
    "As palavras-passe não coincidem. Volte a introduzir a mesma palavra-passe nos dois campos.",
};

export const dictionaries: Record<Locale, Dict> = { en, pt };

export type TranslationKey = keyof typeof en;
