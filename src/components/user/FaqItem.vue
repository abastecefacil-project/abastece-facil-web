<template>
  <v-expansion-panels>
    <v-expansion-panel elevation="1" rounded="lg" class="faq-panel">
      <v-expansion-panel-title class="panel-title">
        <div class="title-content">
          <v-icon icon="mdi-help-circle" color="#1976D2" size="22" class="title-icon"></v-icon>
          <span class="question-text">{{ question }}</span>
        </div>
      </v-expansion-panel-title>
      
      <v-expansion-panel-text class="panel-text">
        <p class="answer-text">{{ answer }}</p>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup>
defineProps({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
})
</script>

<style scoped>
.faq-panel {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
}

.panel-title {
  font-weight: 500;
  color: #424242;
  padding: 16px 20px;
}

.title-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.question-text {
  font-size: 15px;
  font-weight: 500;
  color: #424242;
  line-height: 1.5;
}

.panel-text {
  padding: 0 20px 20px 20px;
}

.answer-text {
  font-size: 14px;
  color: #616161;
  line-height: 1.6;
  margin: 0;
  padding-left: 34px;
}

:deep(.v-expansion-panel-title__icon) {
  color: #757575;
}

@media (max-width: 768px) {
  .panel-title {
    padding: 14px 16px;
  }

  .question-text {
    font-size: 14px;
  }

  .answer-text {
    font-size: 13px;
    padding-left: 0;
  }
}
</style>