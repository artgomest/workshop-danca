ALTER TABLE public.registrations ADD COLUMN status_pagamento TEXT DEFAULT 'pendente';
ALTER TABLE public.registrations ADD COLUMN ref_pagamento TEXT;
