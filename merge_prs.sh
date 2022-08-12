#!/bin/bash
git checkout origin/main
echo "Open PRs to deploy:"
echo "-----"
gh pr list --draft=false --base=main --limit=100 --json number,headRefName,author,mergeable -t "{{ range . }}{{ .number }} {{ .headRefName }} {{ .author.login }} {{ .mergeable }}
{{end}}" | sort -n
echo "-----"
gh pr list --draft=false --base=main --limit=100 --json number,headRefName,mergeable -t "{{ range . }}{{ .number }} {{ .headRefName }} {{ .mergeable }}
{{end}}" | grep MERGEABLE | sort -n | cut -d' ' -f2 | xargs -I{} -n1 git merge origin/{}
