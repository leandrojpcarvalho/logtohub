const friendlyMessages: Record<string, string> = {
  invalid_auth:
    "Token do Slack inválido. Use o Bot User OAuth Token (xoxb-...).",
  not_authed: "Nenhum token foi enviado ao Slack.",
  missing_scope:
    "O app não tem um scope necessário. Adicione em OAuth & Permissions e reinstale o app.",
  name_taken:
    "Já existe um canal com esse nome (pode estar arquivado ou ser privado sem o bot).",
  not_in_channel: "O bot não está no canal. Convide com /invite @seu-app.",
  channel_not_found: "Canal não encontrado ou o bot não tem acesso a ele.",
};

export default friendlyMessages;
