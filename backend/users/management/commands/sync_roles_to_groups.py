from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group


ROLE_GROUPS = ['admin', 'manager', 'doctor', 'creceptionist', 'receptionist']


class Command(BaseCommand):
    help = (
        "Sync legacy users.role to Django auth Groups.\n"
        "- Adds users to the matching group based on their current role.\n"
        "- Optional: use --exclusive to remove other role groups first.\n"
        "- Optional: use --dry-run to preview changes."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--exclusive', action='store_true', default=False,
            help='Remove user from other role groups before adding the mapped one.'
        )
        parser.add_argument(
            '--dry-run', action='store_true', default=False,
            help='Show what would change without modifying the database.'
        )

    def handle(self, *args, **options):
        User = get_user_model()
        exclusive = options['exclusive']
        dry_run = options['dry_run']

        # Ensure groups exist
        for name in ROLE_GROUPS:
            Group.objects.get_or_create(name=name)

        users = User.objects.all()
        updated = 0
        skipped = 0

        for user in users:
            role = getattr(user, 'role', None)
            if not role:
                skipped += 1
                continue

            if role not in ROLE_GROUPS:
                self.stdout.write(self.style.WARNING(
                    f"User {user.id} ({user.username}): unknown role '{role}', skipping"
                ))
                skipped += 1
                continue

            target_group = Group.objects.get(name=role)

            if exclusive:
                # Remove from any role groups before adding the new one
                current_role_groups = user.groups.filter(name__in=ROLE_GROUPS)
                if dry_run:
                    if current_role_groups.exists():
                        self.stdout.write(
                            f"[DRY-RUN] Remove {user.username} from {[g.name for g in current_role_groups]}"
                        )
                else:
                    user.groups.remove(*current_role_groups)

            if dry_run:
                self.stdout.write(
                    f"[DRY-RUN] Add {user.username} to group '{target_group.name}'"
                )
            else:
                user.groups.add(target_group)
                updated += 1

        msg = f"Processed {users.count()} users: updated {updated}, skipped {skipped}"
        if dry_run:
            self.stdout.write(self.style.WARNING('[DRY-RUN] ' + msg))
        else:
            self.stdout.write(self.style.SUCCESS(msg))

