{{-- Plain-text invitation email for an event. No HTML/Markdown dependency. --}}
Hola,

Has sido invitado/a al evento "{{ $event->title }}".

Fecha de inicio: {{ $event->date_start?->format('d/m/Y H:i') }}

Invitado por: {{ $inviterEmail ?? 'Un usuario de LifeLine' }}

Compartido a través de LifeLine.