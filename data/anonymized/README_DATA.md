# Webcraft AI — Dataset do estudo piloto (anonimizado)

Esta pasta contém dados anonimizados do estudo piloto exploratório relatado na dissertação.

## Arquivos
- `webcraft_pilot_anonymized.csv`: dataset numérico/categórico para análise (itens do TAM + satisfação por tarefa).
- `webcraft_pilot_comments_anonymized.csv`: prompts e comentários abertos por tarefa, com conteúdo tratado (redigido).

## Etapas de anonimização (resumo)
- Remoção de identificadores diretos: nome, carimbos de data/hora e links de upload de arquivos.
- Substituição dos participantes por `participant_id` (P01..P05) usando um mapeamento aleatório (nenhuma “chave” é armazenada).
- Generalização de atributos:
  - `age_range`: faixa etária (18-25, 26-35, 36-45, 46+).
  - `role_group`: categoria ampla de função (Dev, QA, Designer, Data, Estudante, Outro).
  - `experience_range`: faixa de experiência na função (0-2, 3-5, 6-10, 10+ anos), derivada do campo original em texto livre.
- Tratamento de campos em texto livre (prompts/comentários):
  - substituição de e-mails/telefones/URLs por placeholders.

## Escalas
- Satisfação por tarefa: 1 a 5 (1 = muito insatisfeito; 5 = muito satisfeito).
- Itens do TAM (PU/PEOU/BI): 1 a 5.

## Dicionário de colunas (`webcraft_pilot_anonymized.csv`)
- `participant_id`: identificador anonimizado do participante.
- `age_range`: faixa etária.
- `role_group`: categoria de função.
- `experience_range`: faixa de experiência com base em “Tempo de experiência na função”.
- `task1_satisfaction_1to5`, `task2_satisfaction_1to5`, `task3_satisfaction_1to5`: satisfação após cada tarefa.
- `tam_pu1..tam_pu5`: itens de utilidade percebida (1-5).
- `tam_peou1..tam_peou4`: itens de facilidade de uso percebida (1-5).
- `tam_bi1..tam_bi3`: itens de intenção comportamental de uso (1-5).
- `experience_building_screens_1to5`: autoavaliação de experiência em desenvolver telas (1-5).
- `frontend_experience_range`: faixa de experiência em front-end (categórica; mantida como no original).

## Observações
Por se tratar de uma amostra pequena e por conveniência (N=5), os resultados são descritivos e não têm pretensão de generalização estatística.