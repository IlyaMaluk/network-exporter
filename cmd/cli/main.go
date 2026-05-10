package main

import (
	"context"
	"fmt"
	"os"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/prometheus/client_golang/api"
	v1 "github.com/prometheus/client_golang/api/prometheus/v1"
)

type appModel struct {
	client  v1.API
	query   string
	result  string
	err     error
	loading bool
}

type queryResultMsg struct {
	result string
}

type errMsg struct {
	err error
}

func initialModel() appModel {
	promURL := os.Getenv("PROMETHEUS_URL")
	if promURL == "" {
		promURL = "http://prometheus:9090"
	}

	client, err := api.NewClient(api.Config{
		Address: promURL,
	})
	if err != nil {
		fmt.Printf("Error creating client: %v\n", err)
		os.Exit(1)
	}

	v1api := v1.NewAPI(client)

	return appModel{
		client:  v1api,
		query:   "node_network_receive_bytes_total",
		loading: true,
	}
}

func (m appModel) Init() tea.Cmd {
	return m.fetchMetrics
}

func (m appModel) fetchMetrics() tea.Msg {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, warnings, err := m.client.Query(ctx, m.query, time.Now(), v1.WithTimeout(5*time.Second))
	if err != nil {
		return errMsg{err: err}
	}

	resStr := result.String()
	if len(warnings) > 0 {
		resStr = fmt.Sprintf("Warnings: %v\n\n%s", warnings, resStr)
	}

	return queryResultMsg{result: resStr}
}

func (m appModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return m, tea.Quit
		}

	case queryResultMsg:
		m.result = msg.result
		m.loading = false
		return m, nil

	case errMsg:
		m.err = msg.err
		m.loading = false
		return m, nil
	}

	return m, nil
}

func (m appModel) View() string {
	if m.err != nil {
		return fmt.Sprintf("Error: %v\n\nPress 'q' to quit.\n", m.err)
	}

	if m.loading {
		return "Querying Prometheus...\n\nPress 'q' to quit.\n"
	}

	chartPlaceholder := `
  [Network Receive Bytes - Placeholder Chart]
  
  10k ┤    ╭──╮
   8k ┤   ╭╯  ╰╮
   6k ┤  ╭╯    ╰╮  ╭──
   4k ┤ ╭╯      ╰──╯
   2k ┼─╯
      └──────────────────
`

	return fmt.Sprintf("Query: %s\n\nResult:\n%s\n%s\nPress 'q' to quit.\n", m.query, m.result, chartPlaceholder)
}

func main() {
	p := tea.NewProgram(initialModel())
	if _, err := p.Run(); err != nil {
		fmt.Printf("Alas, there's been an error: %v\n", err)
		os.Exit(1)
	}
}
