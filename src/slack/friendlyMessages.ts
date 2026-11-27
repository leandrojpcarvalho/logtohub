const friendlyMessages: Record<string, string> = {
  invalid_auth:
    "Token do Slack inválido. Use o Bot User OAuth Token (xoxb-...).",
  not_authed: "Nenhum token foi enviado ao Slack.",
  account_inactive: "O token pertence a um app ou usuário desativado.",
  token_revoked: "O token do Slack foi revogado. Reinstale o app e gere outro.",
  missing_scope:
    "O app não tem um scope necessário. Adicione em OAuth & Permissions e reinstale o app.",
  name_taken:
    "Já existe um canal com esse nome (pode estar arquivado ou ser privado sem o bot).",
  invalid_name:
    "Nome de canal inválido. Use apenas letras minúsculas, números, hífen e underscore (até 80 caracteres).",
  invalid_name_specials:
    "O nome do canal contém caracteres especiais não permitidos pelo Slack.",
  not_in_channel: "O bot não está no canal. Convide com /invite @seu-app.",
  channel_not_found: "Canal não encontrado ou o bot não tem acesso a ele.",
  is_archived: "O canal está arquivado. Desarquive-o ou use outro nome.",
  method_not_supported_for_channel_type:
    "O bot não consegue entrar sozinho em canais privados. Convide com /invite @seu-app.",
  restricted_action:
    "As configurações do workspace impedem essa ação (ex.: criar canais). Fale com um admin.",
  ratelimited:
    "Limite de requisições do Slack atingido. Tente novamente em instantes.",
  msg_too_long: "A mensagem excede o tamanho máximo aceito pelo Slack.",
  users_not_found:
    "Nenhum usuário encontrado com esse e-mail (ou o usuário está desativado).",
  user_not_found: "Um dos IDs de usuário informados não existe no workspace.",
  cant_invite: "O Slack não permitiu convidar esse usuário para o canal.",
  cant_invite_self: "O bot não pode convidar a si mesmo.",
  user_is_restricted:
    "O usuário é guest e não pode ser adicionado a esse canal.",
  no_permission:
    "O bot não tem permissão para essa ação. Verifique os scopes e se ele está no canal.",
  invitee_cant_see_channel: "O usuário convidado não tem acesso a esse canal.",
};

export default friendlyMessages;
