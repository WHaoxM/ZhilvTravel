#!/usr/bin/env bash
set -Eeuo pipefail

SETUP=${1:-/root/wenshu-setup-20261013}
SITE=/opt/wenshu-site
BACKUP="$SETUP/backup"
USER_NAME=wenshu-deploy

test "$(id -u)" -eq 0
test -s "$SETUP/deploy.pub"
test -s "$SETUP/wenshu-release"
test -s "$SETUP/wenshu-ssh-gate"
test -s "$BACKUP/docker-compose.yml"
test -s "$BACKUP/index.sha256"
test -L "$SITE/current"

expected=$(cut -d ' ' -f 1 "$BACKUP/index.sha256")
before=$(curl --noproxy '*' --resolve www.zhilvtravel.com:443:127.0.0.1 \
  -fsS --max-time 10 https://www.zhilvtravel.com/ | sha256sum | cut -d ' ' -f 1)
test "$before" = "$expected"

bash -n "$SETUP/wenshu-release" "$SETUP/wenshu-ssh-gate"
docker compose -f "$SETUP/docker-compose.yml" config --quiet
install -o root -g root -m 0755 "$SETUP/wenshu-release" /usr/local/sbin/wenshu-release
install -o root -g root -m 0755 "$SETUP/wenshu-ssh-gate" /usr/local/sbin/wenshu-ssh-gate

if ! id "$USER_NAME" >/dev/null 2>&1; then
  useradd --create-home --user-group --shell /bin/bash "$USER_NAME"
fi
passwd -l "$USER_NAME" >/dev/null
install -d -o "$USER_NAME" -g "$USER_NAME" -m 0700 "/home/$USER_NAME/.ssh"
key=$(cat "$SETUP/deploy.pub")
[[ "$key" =~ ^ssh-ed25519[[:space:]] ]] || { echo 'Not an Ed25519 public key' >&2; exit 1; }
printf 'restrict,command="/usr/local/sbin/wenshu-ssh-gate" %s\n' "$key" \
  > "/home/$USER_NAME/.ssh/authorized_keys"
chown "$USER_NAME:$USER_NAME" "/home/$USER_NAME/.ssh/authorized_keys"
chmod 0600 "/home/$USER_NAME/.ssh/authorized_keys"
printf '%s\n' 'wenshu-deploy ALL=(root) NOPASSWD: /usr/local/sbin/wenshu-release deploy *' \
  > /etc/sudoers.d/wenshu-deploy
chmod 0440 /etc/sudoers.d/wenshu-deploy
visudo -cf /etc/sudoers.d/wenshu-deploy >/dev/null

install -o root -g root -m 0644 "$SETUP/nginx-static.conf" "$SITE/nginx.static.conf"
install -o root -g root -m 0644 "$SETUP/docker-compose.yml" "$SITE/docker-compose.yml"

if docker compose -f "$SITE/docker-compose.yml" up -d --force-recreate www; then
  after=$(curl --noproxy '*' --resolve www.zhilvtravel.com:443:127.0.0.1 \
    -fsS --retry 5 --retry-delay 1 --max-time 10 https://www.zhilvtravel.com/ |
    sha256sum | cut -d ' ' -f 1) || after=''
  if [[ "$after" == "$expected" ]]; then
    echo "Static container remounted; existing homepage unchanged ($after)."
    exit 0
  fi
fi

echo 'Static remount failed; restoring previous Compose configuration.' >&2
install -o root -g root -m 0644 "$BACKUP/docker-compose.yml" "$SITE/docker-compose.yml"
docker compose -f "$SITE/docker-compose.yml" up -d --force-recreate www
exit 1
