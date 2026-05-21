const handleSave = async () => {
  const newErrors: Record<string, string> = {};
  if (!nome.trim()) newErrors.nome = "Nome é obrigatório";
  if (nome.trim().length < 3) newErrors.nome = "Nome precisa ter pelo menos 3 caracteres";
  if (!categoria) newErrors.categoria = "Selecione uma categoria";
  if (!ownerId) newErrors.owner = "Selecione o responsável";
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    setTab("principal");
    toast.error("Preencha os campos obrigatórios");
    return;
  }
  setErrors({});
  setSaving(true);
  try {
    const metadata = {
      descricao_curta: descricaoCurta, problema_resolve: problemaResolve,
      proposta_valor: propostaValor, beneficio_principal: beneficioPrincipal,
      diferenciais, publico_alvo: publicoAlvo, perfil_nao_indicado: perfilNaoIndicado,
      objecoes_comuns: objecoesComuns, argumento_comercial: argumentoComercial,
      incluso, nao_incluso: naoIncluso, prerequisitos, limites_uso: limitesUso,
      servicos_adicionais: servicosAdicionais, dependencias_internas: dependenciasInternas,
      dependencias_externas: dependenciasExternas, criterios_elegibilidade: criteriosElegibilidade,
      criterios_recusa: criteriosRecusa, condicoes_especiais: condicoesEspeciais,
      modelo_cobranca: modeloCobranca, preco_base: precoBase, setup_implantacao: setupImplantacao,
      adicionais, faixas_preco: faixasPreco, politica_desconto: politicaDesconto,
      aprovacao_desconto: aprovacaoDesconto, regras_cancelamento: regrasCancelamento,
      reajuste, comissao, custo_estimado: custoEstimado, margem_esperada: margemEsperada,
      forma_entrega: formaEntrega, frequencia, entregaveis, prazo_ativacao: prazoAtivacao,
      prazo_entrega: prazoEntrega, sla_atendimento: slaAtendimento,
      canal_atendimento: canalAtendimento, responsavel_execucao: responsavelExecucao,
      responsavel_acompanhamento: responsavelAcompanhamento, criterio_inicio: criterioInicio,
      criterio_conclusao: criterioConclusao, documentos_necessarios: documentosNecessarios,
    };

    // Insere o produto e captura o ID retornado diretamente
    const { data: inserted, error: insertError } = await supabase
      .from("products")
      .insert({
        nome: nome.trim(),
        descricao: descricaoCompleta.trim() || "",
        categoria: categoria as any,
        estagio_atual: estagio as any,
        owner_id: ownerId,
        tipo,
        codigo,
        ativo,
        versao,
        subcategoria,
        area_executora: areaExecutora,
        metadata,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    toast.success("Produto criado!");
    onOpenChange(false);
    // Chama createProduct apenas para disparar o refetch da lista
    await createProduct({
      nome: nome.trim(),
      descricao: descricaoCompleta.trim() || "",
      categoria: categoria as any,
      estagio_atual: estagio as any,
      owner_id: ownerId,
    });
  } catch (err: any) {
    toast.error("Erro ao criar produto", { description: err.message });
  } finally {
    setSaving(false);
  }
};
