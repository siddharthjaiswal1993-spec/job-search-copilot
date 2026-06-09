-- Seed: 100 Target Companies for Siddharth Jaiswal
-- Run in Supabase SQL Editor

INSERT INTO target_companies (name, job_board_type, job_board_token, careers_url, priority, notes) VALUES

-- ── Tier 1: Dream AI-Native ──────────────────────────────────────────────────
('OpenAI',            'greenhouse', 'openai',            'https://openai.com/careers',         'high', 'Tier 1 - Dream AI-native'),
('Anthropic',         'greenhouse', 'anthropic',         'https://www.anthropic.com/careers',   'high', 'Tier 1 - Dream AI-native'),
('Glean',             'greenhouse', 'glean',             'https://www.glean.com/careers',       'high', 'Tier 1 - Enterprise AI search'),
('Perplexity',        'greenhouse', 'perplexity',        'https://www.perplexity.ai/careers',   'high', 'Tier 1 - AI-native'),
('Writer',            'greenhouse', 'writer',            'https://writer.com/careers',          'high', 'Tier 1 - Enterprise AI'),
('Cohere',            'greenhouse', 'cohere',            'https://cohere.com/careers',          'high', 'Tier 1 - Enterprise LLM'),
('Adept',             'greenhouse', 'adept',             'https://www.adept.ai/careers',        'high', 'Tier 1 - Agentic AI'),
('Harvey',            'greenhouse', 'harvey',            'https://www.harvey.ai/careers',       'high', 'Tier 1 - AI legal/enterprise'),
('Sierra',            'greenhouse', 'sierra',            'https://sierra.ai/careers',           'high', 'Tier 1 - AI agents'),
('Hebbia',            'greenhouse', 'hebbia',            'https://www.hebbia.com/careers',      'high', 'Tier 1 - AI for knowledge work'),

-- ── Tier 2: AI + Enterprise Workflow ─────────────────────────────────────────
('Moveworks',         'greenhouse', 'moveworks',         'https://www.moveworks.com/careers',   'high', 'Tier 2 - AI workflow automation'),
('Aisera',            'greenhouse', 'aisera',            'https://aisera.com/careers',          'high', 'Tier 2 - AI service management'),
('Cresta',            'greenhouse', 'cresta',            'https://cresta.com/careers',          'high', 'Tier 2 - AI contact center'),
('UiPath',            'greenhouse', 'uipath',            'https://www.uipath.com/careers',      'high', 'Tier 2 - RPA + AI automation'),
('Automation Anywhere','greenhouse','automation-anywhere','https://www.automationanywhere.com/careers','high','Tier 2 - RPA + AI'),
('Retool',            'greenhouse', 'retool',            'https://retool.com/careers',          'high', 'Tier 2 - Internal tooling platform'),
('Zapier',            'lever',      'zapier',            'https://zapier.com/jobs',             'high', 'Tier 2 - Workflow automation'),
('Airtable',          'greenhouse', 'airtable',          'https://www.airtable.com/careers',    'high', 'Tier 2 - No-code platform'),
('Notion',            'lever',      'notion',            'https://www.notion.so/careers',       'high', 'Tier 2 - Product-led SaaS'),
('Coda',              'greenhouse', 'coda',              'https://coda.io/careers',             'high', 'Tier 2 - Docs + automation'),

-- ── Tier 3: Enterprise SaaS Leaders ──────────────────────────────────────────
('Salesforce',        'manual',     NULL,                'https://careers.salesforce.com',      'medium', 'Tier 3 - Enterprise CRM'),
('ServiceNow',        'manual',     NULL,                'https://careers.servicenow.com',      'medium', 'Tier 3 - Enterprise workflow'),
('Atlassian',         'greenhouse', 'atlassian',         'https://www.atlassian.com/careers',   'medium', 'Tier 3 - Dev + work management'),
('Workday',           'manual',     NULL,                'https://workday.wd5.myworkdayjobs.com','medium', 'Tier 3 - HR + Finance SaaS'),
('HubSpot',           'greenhouse', 'hubspot',           'https://www.hubspot.com/careers',     'medium', 'Tier 3 - CRM + marketing platform'),
('Zendesk',           'greenhouse', 'zendesk',           'https://careers.zendesk.com',         'medium', 'Tier 3 - Customer support platform'),
('Freshworks',        'greenhouse', 'freshworks',        'https://www.freshworks.com/careers',  'medium', 'Tier 3 - CRM + support SaaS'),
('Zoho',              'manual',     NULL,                'https://www.zoho.com/careers',        'medium', 'Tier 3 - Enterprise SaaS suite'),
('Gainsight',         'greenhouse', 'gainsight',         'https://www.gainsight.com/careers',   'medium', 'Tier 3 - Customer success platform'),
('Sprinklr',          'greenhouse', 'sprinklr',          'https://careers.sprinklr.com',        'medium', 'Tier 3 - Unified CX platform'),

-- ── Tier 4: Platform & Infrastructure SaaS ───────────────────────────────────
('Rippling',          'lever',      'rippling',          'https://www.rippling.com/careers',    'medium', 'Tier 4 - HR/IT/Finance platform'),
('Okta',              'greenhouse', 'okta',              'https://www.okta.com/careers',        'medium', 'Tier 4 - IAM platform'),
('Postman',           'greenhouse', 'postman',           'https://www.postman.com/careers',     'medium', 'Tier 4 - API platform'),
('Datadog',           'greenhouse', 'datadog',           'https://www.datadoghq.com/careers',   'medium', 'Tier 4 - Observability platform'),
('HashiCorp',         'greenhouse', 'hashicorp',         'https://www.hashicorp.com/careers',   'medium', 'Tier 4 - Infrastructure automation'),
('PagerDuty',         'greenhouse', 'pagerduty',         'https://www.pagerduty.com/careers',   'medium', 'Tier 4 - Operations platform'),
('Cloudflare',        'greenhouse', 'cloudflare',        'https://www.cloudflare.com/careers',  'medium', 'Tier 4 - Network + security platform'),
('Snowflake',         'greenhouse', 'snowflake',         'https://careers.snowflake.com',       'medium', 'Tier 4 - Data cloud platform'),
('Confluent',         'greenhouse', 'confluent',         'https://www.confluent.io/careers',    'medium', 'Tier 4 - Data streaming platform'),
('MongoDB',           'greenhouse', 'mongodb-inc',       'https://www.mongodb.com/careers',     'medium', 'Tier 4 - Database platform'),

-- ── Tier 5: Product-Led SaaS ──────────────────────────────────────────────────
('Miro',              'greenhouse', 'miro',              'https://miro.com/careers',            'medium', 'Tier 5 - Visual collaboration'),
('Asana',             'greenhouse', 'asana',             'https://asana.com/jobs',              'medium', 'Tier 5 - Work management'),
('Monday.com',        'greenhouse', 'monday',            'https://monday.com/careers',          'medium', 'Tier 5 - Work OS'),
('Linear',            'manual',     NULL,                'https://linear.app/careers',          'medium', 'Tier 5 - Issue tracking'),
('Canva',             'greenhouse', 'canva',             'https://www.canva.com/careers',       'medium', 'Tier 5 - Design platform'),
('Figma',             'greenhouse', 'figma',             'https://www.figma.com/careers',       'medium', 'Tier 5 - Design platform'),
('Lucid',             'greenhouse', 'lucid',             'https://www.lucid.co/careers',        'medium', 'Tier 5 - Visual workspace'),
('Slack',             'manual',     NULL,                'https://slack.com/careers',           'medium', 'Tier 5 - Now under Salesforce'),
('Box',               'greenhouse', 'box',               'https://careers.box.com',             'medium', 'Tier 5 - Cloud content platform'),
('Dropbox',           'greenhouse', 'dropbox',           'https://jobs.dropbox.com',            'medium', 'Tier 5 - Cloud storage + docs'),

-- ── Tier 6: High-Growth India SaaS ───────────────────────────────────────────
('Darwinbox',         'greenhouse', 'darwinbox',         'https://darwinbox.com/careers',       'medium', 'Tier 6 - HR SaaS, India'),
('Whatfix',           'greenhouse', 'whatfix',           'https://whatfix.com/careers',         'medium', 'Tier 6 - DAP platform, India'),
('Chargebee',         'greenhouse', 'chargebee',         'https://www.chargebee.com/careers',   'medium', 'Tier 6 - Subscription billing'),
('BrowserStack',      'greenhouse', 'browserstack',      'https://www.browserstack.com/careers','medium', 'Tier 6 - QA platform, India'),
('CleverTap',         'greenhouse', 'clevertap',         'https://clevertap.com/careers',       'medium', 'Tier 6 - User engagement, India'),
('MoEngage',          'greenhouse', 'moengage',          'https://www.moengage.com/careers',    'medium', 'Tier 6 - Customer engagement, India'),
('HighRadius',        'greenhouse', 'highradius',        'https://www.highradius.com/careers',  'medium', 'Tier 6 - AR automation, India'),
('Hasura',            'greenhouse', 'hasura',            'https://hasura.io/careers',           'medium', 'Tier 6 - Data API platform'),
('Facets.cloud',      'manual',     NULL,                'https://facets.cloud/careers',        'low',    'Tier 6 - DevOps platform'),
('Perfios',           'manual',     NULL,                'https://www.perfios.com/careers',     'low',    'Tier 6 - Fintech SaaS, India'),

-- ── Tier 7: AI Startups ───────────────────────────────────────────────────────
('Sarvam AI',         'manual',     NULL,                'https://sarvam.ai/careers',           'medium', 'Tier 7 - India AI startup'),
('Lyzr',              'manual',     NULL,                'https://lyzr.ai/careers',             'low',    'Tier 7 - AI agent framework'),
('Gushwork',          'manual',     NULL,                'https://www.gushwork.ai/careers',     'low',    'Tier 7 - AI work automation'),
('DevRev',            'greenhouse', 'devrev',            'https://devrev.ai/careers',           'medium', 'Tier 7 - Dev + CRM AI platform'),
('Unify',             'manual',     NULL,                'https://www.unifygtm.com/careers',    'low',    'Tier 7 - GTM AI'),
('Clay',              'greenhouse', 'clay-labs',         'https://www.clay.com/careers',        'medium', 'Tier 7 - Data enrichment AI'),
('11x',               'manual',     NULL,                'https://11x.ai/careers',              'low',    'Tier 7 - AI SDR'),
('Synthesia',         'greenhouse', 'synthesia',         'https://www.synthesia.io/careers',    'medium', 'Tier 7 - AI video platform'),
('Runway',            'greenhouse', 'runwayml',          'https://runwayml.com/careers',        'medium', 'Tier 7 - AI creative platform'),
('Cursor',            'manual',     NULL,                'https://cursor.com/careers',          'medium', 'Tier 7 - AI code editor'),

-- ── Tier 8: Cloud & Enterprise Platforms ─────────────────────────────────────
('Microsoft',         'manual',     NULL,                'https://careers.microsoft.com',       'low',    'Tier 8 - Big Tech'),
('Google',            'manual',     NULL,                'https://careers.google.com',          'low',    'Tier 8 - Big Tech'),
('AWS',               'manual',     NULL,                'https://www.amazon.jobs',             'low',    'Tier 8 - Big Tech'),
('Adobe',             'manual',     NULL,                'https://careers.adobe.com',           'low',    'Tier 8 - Enterprise software'),
('Oracle',            'manual',     NULL,                'https://careers.oracle.com',          'low',    'Tier 8 - Enterprise software'),
('SAP',               'manual',     NULL,                'https://jobs.sap.com',                'low',    'Tier 8 - Enterprise software'),
('Cisco',             'manual',     NULL,                'https://jobs.cisco.com',              'low',    'Tier 8 - Enterprise networking'),
('VMware',            'manual',     NULL,                'https://careers.vmware.com',          'low',    'Tier 8 - Virtualization'),
('Red Hat',           'manual',     NULL,                'https://www.redhat.com/en/jobs',      'low',    'Tier 8 - Open source enterprise'),
('Nutanix',           'greenhouse', 'nutanix',           'https://www.nutanix.com/careers',     'low',    'Tier 8 - Cloud infrastructure'),

-- ── Tier 9: Customer Success / Revenue Intelligence / Ops ────────────────────
('SiftHub',           'manual',     NULL,                'https://sifthub.io/careers',          'medium', 'Tier 9 - AI sales enablement'),
('People.ai',         'greenhouse', 'people-ai',         'https://people.ai/careers',           'medium', 'Tier 9 - Revenue intelligence AI'),
('Clari',             'greenhouse', 'clari',             'https://www.clari.com/careers',       'medium', 'Tier 9 - Revenue operations AI'),
('Gong',              'greenhouse', 'gong',              'https://www.gong.io/careers',         'medium', 'Tier 9 - Revenue intelligence'),
('Outreach',          'greenhouse', 'outreach',          'https://www.outreach.io/careers',     'medium', 'Tier 9 - Sales engagement'),
('Salesloft',         'greenhouse', 'salesloft',         'https://salesloft.com/careers',       'medium', 'Tier 9 - Sales engagement'),
('Chorus',            'manual',     NULL,                'https://www.chorus.ai/careers',       'low',    'Tier 9 - Conversation intelligence'),
('Apollo',            'greenhouse', 'apolloio',          'https://www.apollo.io/careers',       'medium', 'Tier 9 - Sales intelligence'),
('Pocus',             'manual',     NULL,                'https://www.pocus.com/careers',       'medium', 'Tier 9 - Product-led sales'),
('Common Room',       'manual',     NULL,                'https://www.commonroom.io/careers',   'medium', 'Tier 9 - Community intelligence'),

-- ── Tier 10: Strategic Stretch Targets ───────────────────────────────────────
('Palantir',          'lever',      'palantir',          'https://www.palantir.com/careers',    'medium', 'Tier 10 - Enterprise data platform'),
('Stripe',            'greenhouse', 'stripe',            'https://stripe.com/jobs',             'medium', 'Tier 10 - Payments infrastructure'),
('Brex',              'greenhouse', 'brex',              'https://www.brex.com/careers',        'medium', 'Tier 10 - Finance platform'),
('Mercury',           'manual',     NULL,                'https://mercury.com/jobs',            'medium', 'Tier 10 - Banking for startups'),
('Ramp',              'greenhouse', 'ramp',              'https://ramp.com/careers',            'medium', 'Tier 10 - Finance automation'),
('Deel',              'greenhouse', 'deel',              'https://www.deel.com/careers',        'medium', 'Tier 10 - Global HR platform'),
('Remote',            'greenhouse', 'remote',            'https://remote.com/careers',          'medium', 'Tier 10 - Global employment'),
('Vercel',            'greenhouse', 'vercel',            'https://vercel.com/careers',          'medium', 'Tier 10 - Frontend cloud'),
('Supabase',          'manual',     NULL,                'https://supabase.com/careers',        'medium', 'Tier 10 - Open source BaaS'),
('Pinecone',          'greenhouse', 'pinecone',          'https://www.pinecone.io/careers',     'medium', 'Tier 10 - Vector database');
